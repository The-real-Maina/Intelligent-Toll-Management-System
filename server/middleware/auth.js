const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // No authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      req.user = decoded;

      return next();
    } catch (error) {
      // Token expired
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Session expired. Please login again.",
        });
      }

      // Token invalid
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          message: "Invalid token. Please login again.",
        });
      }

      console.error("JWT verification error:", error);

      return res.status(401).json({
        message: "Authentication failed.",
      });
    }
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      message: "Server authentication error.",
    });
  }
};


// Role authorization
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};