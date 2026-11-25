const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth"); // Assuming your auth middleware is exported here

const {
  getSettings,
  updateSettings,
  getUserPreferences,
  updateUserPreferences,
  changePassword,
  updateProfile,
} = require("../controllers/settingsController");

// Global Settings (Admin only usually, but you can protect inside controller if needed)
router.get("/", getSettings);
router.put("/", updateSettings);

// User Specific Routes (Protected)
router.get("/user-preferences", authenticate, getUserPreferences);
router.put("/user-preferences", authenticate, updateUserPreferences);

// Account Routes
router.put("/change-password", changePassword);
router.put("/update-profile", updateProfile);

module.exports = router;