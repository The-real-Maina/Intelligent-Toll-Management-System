const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { logAction } = require("./auditController");

// Get all drivers belonging to my company
const getCompanyDrivers = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) return res.status(403).json({ message: "No company linked." });

    const [rows] = await db.query(
      `SELECT user_id, full_name, email, phone, role, created_at 
       FROM users 
       WHERE company_id = ? AND role = 'Driver'
       ORDER BY created_at DESC`,
      [companyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching drivers." });
  }
};

// Create a new driver under my company
const createCompanyDriver = async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  const companyId = req.user.company_id;
  if (!companyId) return res.status(403).json({ message: "No company linked." });
  if (!full_name || !email || !password) return res.status(400).json({ message: "All fields required" });

  try {
    const [existing] = await db.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, password, role, is_verified, company_id)
       VALUES (?, ?, ?, ?, 'Driver', 1, ?)`,
      [full_name, email, phone, hash, companyId]
    );
    await logAction(req.user.user_id, "COMPANY_DRIVER_CREATED", `Created driver ${email}`);
    res.status(201).json({ message: "Driver created", user_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Error creating driver", error: err.message });
  }
};

// Remove a driver
const deleteCompanyDriver = async (req, res) => {
  const { id } = req.params;
  const companyId = req.user.company_id;
  if (!companyId) return res.status(403).json({ message: "No company linked." });

  try {
    const [rows] = await db.query(
      "SELECT user_id FROM users WHERE user_id = ? AND company_id = ?",
      [id, companyId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Driver not found in your company." });

    await db.query("DELETE FROM users WHERE user_id = ? AND company_id = ?", [id, companyId]);
    await logAction(req.user.user_id, "COMPANY_DRIVER_DELETED", `Deleted driver #${id}`);
    res.json({ message: "Driver removed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Error deleting driver." });
  }
};

module.exports = { getCompanyDrivers, createCompanyDriver, deleteCompanyDriver };