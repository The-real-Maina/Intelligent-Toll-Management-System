const db = require("../config/db");

// Get all audit logs (Admin only)
const getAuditLogs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, u.full_name as user_name, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching audit logs" });
  }
};

// Helper function to be called inside other controllers
const logAction = async (userId, action, details) => {
  try {
    await db.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)",
      [userId, action, details]
    );
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};

module.exports = { getAuditLogs, logAction };