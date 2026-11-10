const db = require("../config/db");
const { logAction } = require("./auditController");

// Clock In
const clockIn = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Check if already clocked in
    const [active] = await db.query(
      "SELECT * FROM staff_attendance WHERE user_id = ? AND shift_status = 'Active'",
      [userId]
    );

    if (active.length > 0) {
      return res.status(400).json({ message: "You are already clocked in." });
    }

    await db.query(
      "INSERT INTO staff_attendance (user_id) VALUES (?)",
      [userId]
    );

    await logAction(userId, "CLOCK_IN", "Toll Attendant started shift");

    res.status(201).json({ message: "Clocked in successfully. Have a good shift!" });
  } catch (err) {
    res.status(500).json({ message: "Error clocking in" });
  }
};

// Clock Out
const clockOut = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [active] = await db.query(
      "SELECT * FROM staff_attendance WHERE user_id = ? AND shift_status = 'Active'",
      [userId]
    );

    if (active.length === 0) {
      return res.status(400).json({ message: "You are not clocked in." });
    }

    await db.query(
      "UPDATE staff_attendance SET clock_out = NOW(), shift_status = 'Completed' WHERE attendance_id = ?",
      [active[0].attendance_id]
    );

    await logAction(userId, "CLOCK_OUT", "Toll Attendant ended shift");

    res.json({ message: "Clocked out successfully. Thank you for your service." });
  } catch (err) {
    res.status(500).json({ message: "Error clocking out" });
  }
};

// Get my shift status
const getMyShift = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Get user shift type
    const [userRows] = await db.query("SELECT shift_type FROM users WHERE user_id = ?", [userId]);
    
    // Get active shift
    const [active] = await db.query(
      "SELECT * FROM staff_attendance WHERE user_id = ? AND shift_status = 'Active'",
      [userId]
    );

    // Get recent history (last 5)
    const [history] = await db.query(
      "SELECT * FROM staff_attendance WHERE user_id = ? ORDER BY clock_in DESC LIMIT 5",
      [userId]
    );

    res.json({
      shift_type: userRows[0]?.shift_type || "Day",
      is_active: active.length > 0,
      current_shift: active[0] || null,
      history
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching shift" });
  }
};

// Admin: Get all attendance
const getAllAttendance = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, u.full_name, u.role, u.shift_type 
      FROM staff_attendance a
      JOIN users u ON a.user_id = u.user_id
      ORDER BY a.clock_in DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

module.exports = { clockIn, clockOut, getMyShift, getAllAttendance };