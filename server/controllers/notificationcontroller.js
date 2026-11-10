const db = require("../config/db");

// Get my notifications
const getMyNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// Mark all as read
const markAsRead = async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
      [req.user.user_id]
    );
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Error updating notifications" });
  }
};

// Helper to create a notification (Used by other controllers)
const createNotification = async (userId, title, message) => {
  try {
    await db.query(
      "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
      [userId, title, message]
    );
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

module.exports = { getMyNotifications, markAsRead, createNotification };