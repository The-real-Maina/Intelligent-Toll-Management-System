const express = require("express");
const router = express.Router();
const {
  register, login, verifyOtp, verifyLoginOtp, forgotPassword, resetPassword,
} = require("../controllers/authController");
const { registerCompany, checkCompanyStatus } = require("../controllers/companyAuthController");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/verify-login-otp", verifyLoginOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/register-company", registerCompany);
router.get("/company-status/:email", checkCompanyStatus);

module.exports = router;