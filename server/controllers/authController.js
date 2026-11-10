const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const ALLOWED_ROLES = ["Admin", "Driver", "Toll Attendant", "Company Admin"];

const otpAttempts = new Map();
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const demoOtp = (otp) => process.env.SHOW_DEMO_OTP === "true" ? { simulated_otp: otp } : {};

const signToken = (user) =>
  jwt.sign(
    { user_id: user.user_id, role: user.role, company_id: user.company_id || null },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

const loginSuccess = (user) => ({
  message: "Login successful",
  token: signToken(user),
  user: {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    company_id: user.company_id || null,
  },
});

const issueOtp = async (user) => {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db.query("UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE user_id = ?", [otp, expiresAt, user.user_id]);
  otpAttempts.delete(user.email);
  console.log(`\n================================\n🔑 OTP for ${user.email}: ${otp}\n================================\n`);
  return otp;
};

const checkOtp = (user, otp) => {
  const attempts = otpAttempts.get(user.email) || 0;
  if (attempts >= MAX_OTP_ATTEMPTS) return "Too many wrong attempts.";
  if (!user.otp_code || !otp) return "No active OTP.";
  if (new Date() > new Date(user.otp_expires_at)) return "OTP has expired.";
  if (String(user.otp_code) !== String(otp).trim()) {
    otpAttempts.set(user.email, attempts + 1);
    return "Invalid OTP code";
  }
  return null;
};

const isAdminRequest = (req) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return false;
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    return decoded.role === "Admin";
  } catch { return false; }
};

const register = async (req, res) => {
  const { full_name, email, phone, password, role, company_id } = req.body;
  if (!full_name || !email || !password) return res.status(400).json({ message: "Required fields missing" });

  try {
    const [existing] = await db.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isAdminRequest(req)) {
      const newRole = ALLOWED_ROLES.includes(role) ? role : "Driver";
      const [result] = await db.query(
        `INSERT INTO users (full_name, email, phone, password, role, is_verified, company_id)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [full_name, email, phone || null, hashedPassword, newRole, company_id || null]
      );
      return res.status(201).json({ message: "User created successfully", user_id: result.insertId });
    }

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, password, role, is_verified)
       VALUES (?, ?, ?, ?, 'Driver', 0)`,
      [full_name, email, phone || null, hashedPassword]
    );

    const otp = await issueOtp({ user_id: result.insertId, email });
    res.status(201).json({ message: "User registered.", user_id: result.insertId, ...demoOtp(otp) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    const user = rows[0];
    if (user.is_verified) return res.status(400).json({ message: "Account already verified" });
    const problem = checkOtp(user, otp);
    if (problem) return res.status(400).json({ message: problem });
    await db.query("UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE user_id = ?", [user.user_id]);
    otpAttempts.delete(user.email);
    res.json({ message: "Account verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    if (user.role === "Admin") return res.json(loginSuccess(user));

    if (user.role === "Toll Attendant") {
      const otp = await issueOtp(user);
      return res.json({ message: "Enter OTP", otp_required: true, email: user.email, ...demoOtp(otp) });
    }

    if (!user.is_verified) {
      const otp = await issueOtp(user);
      return res.status(403).json({ message: "Verify email", needs_verification: true, email: user.email, ...demoOtp(otp) });
    }

    res.json(loginSuccess(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

const verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "Invalid request" });
    const user = rows[0];
    if (user.role !== "Toll Attendant") return res.status(400).json({ message: "Only for Toll Attendants" });
    const problem = checkOtp(user, otp);
    if (problem) return res.status(400).json({ message: problem });
    await db.query("UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE user_id = ?", [user.user_id]);
    otpAttempts.delete(user.email);
    res.json(loginSuccess(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    const user = rows[0];
    const otp = await issueOtp(user);
    res.json({ message: "OTP sent for password reset.", ...demoOtp(otp) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    const user = rows[0];
    const problem = checkOtp(user, otp);
    if (problem) return res.status(400).json({ message: problem });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL WHERE user_id = ?", [hashedPassword, user.user_id]);
    otpAttempts.delete(user.email);
    res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, verifyOtp, verifyLoginOtp, forgotPassword, resetPassword };