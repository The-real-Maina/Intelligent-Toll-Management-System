const jwt = require("jsonwebtoken");

// Protect routes
const protect = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // Temporary user for testing before JWT login is connected
      req.user = {
        user_id: 1,
        role: "admin"
      };

      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided."
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    console.error(error);

    res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};


module.exports = {
  protect
};