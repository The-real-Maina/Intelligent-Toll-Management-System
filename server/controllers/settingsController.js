const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Get all settings
const getSettings = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM settings");
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching settings" });
  }
};

// Update setting
const updateSetting = async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;
    await db.query(
      `INSERT INTO settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [setting_key, setting_value, setting_value]
    );
    res.json({ message: "Setting updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating setting" });
  }
};

// Update multiple settings at once
const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, value, value]
      );
    }
    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating settings" });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { user_id, current_password, new_password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE user_id = ?",
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(current_password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, user_id]
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error changing password" });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { user_id, full_name, email, phone } = req.body;

    const [result] = await db.query(
      "UPDATE users SET full_name = ?, email = ?, phone = ? WHERE user_id = ?",
      [full_name, email, phone, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Error updating profile" });
  }
};

module.exports = {
  getSettings,
  updateSetting,
  updateSettings,
  changePassword,
  updateProfile,
};