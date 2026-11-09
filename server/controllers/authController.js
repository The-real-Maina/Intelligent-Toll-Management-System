const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const OTP_TTL_MS = 10 * 60 * 1000; // OTP is valid for 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const ALLOWED_ROLES = ["Admin", "Driver", "Toll Attendant"];

// Wrong OTP attempts per email (kept in memory, cleared when a new OTP is issued)
const otpAttempts = new Map();

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

// The OTP is only sent to the browser when SHOW_DEMO_OTP=true is set in .env.
// By default it appears only in the server terminal.
const demoOtp = (otp) =>
  process.env.SHOW_DEMO_OTP === "true" ? { simulated_otp: otp } : {};

const signToken = (user) =>
  jwt.sign(
    { user_id: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

const loginSuccess = (user) => ({
  message: "Login successful",
  token: signToken(user),
  user: {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  },
});

// Saves a fresh OTP for the user and returns it
const issueOtp = async (user) => {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.query(
    "UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE user_id = ?",
    [otp, expiresAt, user.user_id]
  );

  otpAttempts.delete(user.email);

  // Logged to the server terminal for presentation/testing
  console.log(
    `\n================================\n🔑 OTP for ${user.email}: ${otp}\n================================\n`
  );

  return otp;
};

// Returns an error message if the OTP is not acceptable, otherwise null
const checkOtp = (user, otp) => {
  const attempts = otpAttempts.get(user.email) || 0;

  if (attempts >= MAX_OTP_ATTEMPTS) {
    return "Too many wrong attempts. Please log in again to get a new code.";
  }
  if (!user.otp_code || !otp) {
    return "No active OTP. Please log in again to get a new code.";
  }
  if (new Date() > new Date(user.otp_expires_at)) {
    return "OTP has expired. Please log in again to get a new code.";
  }
  if (String(user.otp_code) !== String(otp).trim()) {
    otpAttempts.set(user.email, attempts + 1);
    return "Invalid OTP code";
  }
  return null;
};

// True only if the request carries a valid Admin token
const isAdminRequest = (req) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return false;
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    return decoded.role === "Admin";
  } catch {
    return false;
  }
};

// Register User
// - Public sign-up: always a Driver, must verify the OTP once
// - Admin creating a user (Users page): any role, already verified, no OTP
const register = async (req, res) => {
  const { full_name, email, phone, password, role } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      message: "full_name, email and password are required",
    });
  }

  try {
    const [existingUser] = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Admin-created account
    if (isAdminRequest(req)) {
      const newRole = ALLOWED_ROLES.includes(role) ? role : "Driver";

      const [result] = await db.query(
        `INSERT INTO users (full_name, email, phone, password, role, is_verified)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [full_name, email, phone || null, hashedPassword, newRole]
      );

      return res.status(201).json({
        message: "User created successfully",
        user_id: result.insertId,
      });
    }

    // Public sign-up: Driver only, unverified until the OTP is entered
    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, password, role, is_verified)
       VALUES (?, ?, ?, ?, 'Driver', 0)`,
      [full_name, email, phone || null, hashedPassword]
    );

    const otp = await issueOtp({ user_id: result.insertId, email });

    res.status(201).json({
      message: "User registered. Please verify your account.",
      user_id: result.insertId,
      ...demoOtp(otp),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

// Verify the registration OTP (Drivers, once)
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    if (user.is_verified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    const problem = checkOtp(user, otp);
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    await db.query(
      "UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE user_id = ?",
      [user.user_id]
    );
    otpAttempts.delete(user.email);

    res.json({ message: "Account verified successfully! You can now login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};

// Login User
// - Admin: password only
// - Toll Attendant: password, then an OTP on every login
// - Driver: password (email must have been verified at registration)
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Admin never needs an OTP
    if (user.role === "Admin") {
      return res.json(loginSuccess(user));
    }

    // Toll Attendant: OTP every time, no token until it is verified
    if (user.role === "Toll Attendant") {
      const otp = await issueOtp(user);
      return res.json({
        message: "Enter the OTP to finish logging in.",
        otp_required: true,
        email: user.email,
        ...demoOtp(otp),
      });
    }

    // Driver who never finished registration: send a fresh OTP
    if (!user.is_verified) {
      const otp = await issueOtp(user);
      return res.status(403).json({
        message: "Please verify your email with the OTP.",
        needs_verification: true,
        email: user.email,
        ...demoOtp(otp),
      });
    }

    res.json(loginSuccess(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

// Verify the login OTP (Toll Attendants, every login)
const verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid request" });
    }

    const user = rows[0];

    if (user.role !== "Toll Attendant") {
      return res.status(400).json({ message: "OTP login is only for Toll Attendants" });
    }

    const problem = checkOtp(user, otp);
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    // OTP can only be used once
    await db.query(
      "UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE user_id = ?",
      [user.user_id]
    );
    otpAttempts.delete(user.email);

    res.json(loginSuccess(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  verifyLoginOtp,
};