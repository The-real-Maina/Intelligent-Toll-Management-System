const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSetting,
  updateSettings,
  changePassword,
  updateProfile,
} = require("../controllers/settingsController");

router.get("/", getSettings);
router.put("/", updateSettings);
router.put("/single", updateSetting);
router.put("/change-password", changePassword);
router.put("/update-profile", updateProfile);

module.exports = router;