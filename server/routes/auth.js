const express = require("express");
const router = express.Router();

const {
  register,
  login,
  verifyOtp,
  verifyLoginOtp,
  forgotPassword, // <-- ADDED
  resetPassword,  // <-- ADDED
} = require("../controllers/authController");

// Register user (public = Driver, Admin token = any role)
router.post("/register", register);

// Verify registration OTP (Drivers)
router.post("/verify-otp", verifyOtp);

// Login user
router.post("/login", login);

// Verify login OTP (Toll Attendants)
router.post("/verify-login-otp", verifyLoginOtp);

// Forgot Password routes (NEW)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;