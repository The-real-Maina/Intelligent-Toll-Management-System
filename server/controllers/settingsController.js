const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Get global settings
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

// Update multiple global settings at once
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

// Get User-Specific Preferences
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.user_id; // From auth middleware
    const [rows] = await db.query("SELECT preferences FROM user_settings WHERE user_id = ?", [userId]);
    
    if (rows.length === 0) {
      return res.json({ preferences: {} }); // Return empty if none exist yet
    }
    
    // MySQL JSON columns come back as strings sometimes, ensure it's parsed
    const prefs = typeof rows[0].preferences === 'string' 
      ? JSON.parse(rows[0].preferences) 
      : rows[0].preferences;
      
    res.json({ preferences: prefs || {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user preferences" });
  }
};

// Update User-Specific Preferences
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { preferences } = req.body; // Expecting a JSON object

    await db.query(
      `INSERT INTO user_settings (user_id, preferences) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE preferences = ?`,
      [userId, JSON.stringify(preferences), JSON.stringify(preferences)]
    );

    res.json({ message: "Preferences updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user preferences" });
  }
};

// Change password (Unchanged)
const changePassword = async (req, res) => {
  try {
    const { user_id, current_password, new_password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [user_id]);

    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(current_password, user.password);

    if (!passwordMatch) return res.status(401).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, user_id]);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error changing password" });
  }
};

// Update profile (Unchanged)
const updateProfile = async (req, res) => {
  try {
    const { user_id, full_name, email, phone } = req.body;
    const [result] = await db.query(
      "UPDATE users SET full_name = ?, email = ?, phone = ? WHERE user_id = ?",
      [full_name, email, phone, user_id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Email already exists" });
    res.status(500).json({ message: "Error updating profile" });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getUserPreferences,
  updateUserPreferences,
  changePassword,
  updateProfile,
};