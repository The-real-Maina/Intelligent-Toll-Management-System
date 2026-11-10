const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../config/db");
const authenticate = require("../middleware/auth");
const { authorize } = require("../middleware/auth");

// GET / - list drivers belonging to the logged-in company admin's company
router.get("/", authenticate, authorize("Company Admin"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, full_name, email, phone, created_at
       FROM users
       WHERE company_id = ? AND role = 'Driver'
       ORDER BY created_at DESC`,
      [req.user.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Company drivers list error:", err.message);
    res.status(500).json({ message: "Failed to load drivers" });
  }
});

// POST / - company admin creates a driver account linked to their company
router.post("/", authenticate, authorize("Company Admin"), async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await db.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "A user with that email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (full_name, email, phone, password, role, company_id)
       VALUES (?, ?, ?, ?, 'Driver', ?)`,
      [full_name, email, phone, hashed, req.user.company_id]
    );

    res.status(201).json({ message: "Driver created" });
  } catch (err) {
    console.error("Company drivers create error:", err.message);
    res.status(500).json({ message: "Failed to create driver" });
  }
});

module.exports = router;