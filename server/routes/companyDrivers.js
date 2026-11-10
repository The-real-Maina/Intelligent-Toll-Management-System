const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../config/db");
const authenticate = require("../middleware/auth");
const { authorize } = require("../middleware/auth");

// GET / - drivers of the logged-in company, each with their assigned vehicles
router.get("/", authenticate, authorize("Company Admin"), async (req, res) => {
  try {
    const [drivers] = await db.query(
      `SELECT user_id, full_name, email, phone, created_at
       FROM users
       WHERE company_id = ? AND role = 'Driver'
       ORDER BY created_at DESC`,
      [req.user.company_id]
    );

    const [vehicles] = await db.query(
      `SELECT vehicle_id, plate_number, vehicle_type, assigned_driver_id
       FROM vehicles
       WHERE company_id = ?`,
      [req.user.company_id]
    );

    res.json({
      vehicles,
      drivers: drivers.map((d) => ({
        ...d,
        vehicles: vehicles.filter((v) => v.assigned_driver_id === d.user_id),
      })),
    });
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

// PUT /assign - assign a fleet vehicle to a driver (driver_id null = unassign)
router.put("/assign", authenticate, authorize("Company Admin"), async (req, res) => {
  try {
    const { vehicle_id, driver_id } = req.body;
    const companyId = req.user.company_id;

    if (!vehicle_id) {
      return res.status(400).json({ message: "vehicle_id is required" });
    }

    const [vehicle] = await db.query(
      "SELECT vehicle_id FROM vehicles WHERE vehicle_id = ? AND company_id = ?",
      [vehicle_id, companyId]
    );
    if (vehicle.length === 0) {
      return res.status(404).json({ message: "Vehicle not found in your fleet" });
    }

    if (driver_id) {
      const [driver] = await db.query(
        "SELECT user_id FROM users WHERE user_id = ? AND company_id = ? AND role = 'Driver'",
        [driver_id, companyId]
      );
      if (driver.length === 0) {
        return res.status(404).json({ message: "Driver not found in your company" });
      }
    }

    await db.query(
      "UPDATE vehicles SET assigned_driver_id = ? WHERE vehicle_id = ? AND company_id = ?",
      [driver_id || null, vehicle_id, companyId]
    );

    res.json({ message: driver_id ? "Vehicle assigned" : "Vehicle unassigned" });
  } catch (err) {
    console.error("Assign vehicle error:", err.message);
    res.status(500).json({ message: "Failed to assign vehicle" });
  }
});

module.exports = router;