const jwt = require("jsonwebtoken");

// Verifies the JWT and attaches the user to req.user
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Normalize so controllers can always rely on user_id and role
    req.user = {
      ...decoded,
      user_id: decoded.user_id ?? decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Optional: restrict a route to certain roles, e.g. authorize("Admin")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// Export under every common name so existing imports keep working
module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.protect = authenticate;
module.exports.verifyToken = authenticate;
module.exports.authenticateToken = authenticate;
module.exports.auth = authenticate;
module.exports.authorize = authorize;