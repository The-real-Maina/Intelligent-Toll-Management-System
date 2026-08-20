const db = require("../config/db");

// Get all vehicles.
// Admins see every vehicle. Drivers only see vehicles registered to them.
const getVehicles = async (req, res) => {
  try {
    let rows;

    if (req.user.role === "Driver") {
      [rows] = await db.query(
        "SELECT * FROM vehicles WHERE user_id = ?",
        [req.user.user_id]
      );
    } else {
      [rows] = await db.query("SELECT * FROM vehicles");
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching vehicles" });
  }
};

// Get one vehicle. Drivers can only fetch their own.
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM vehicles WHERE vehicle_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const vehicle = rows[0];

    if (req.user.role === "Driver" && vehicle.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching vehicle" });
  }
};

// Create vehicle. The vehicle is always registered to whoever is logged in.
const createVehicle = async (req, res) => {
  try {
    const { plate_number, owner_name, vehicle_type, owner_phone } = req.body;

    const [result] = await db.query(
      `INSERT INTO vehicles (plate_number, owner_name, vehicle_type, owner_phone, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [plate_number, owner_name, vehicle_type, owner_phone, req.user.user_id]
    );

    res.status(201).json({
      message: "Vehicle added successfully",
      vehicle_id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Plate number already exists" });
    }
    res.status(500).json({ message: "Error creating vehicle" });
  }
};

// Update vehicle. Drivers can only update their own; Admins can update any.
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { plate_number, owner_name, vehicle_type, owner_phone } = req.body;

    if (req.user.role === "Driver") {
      const [existing] = await db.query(
        "SELECT user_id FROM vehicles WHERE vehicle_id = ?",
        [id]
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      if (existing[0].user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const [result] = await db.query(
      `UPDATE vehicles SET plate_number = ?, owner_name = ?, vehicle_type = ?, owner_phone = ?
       WHERE vehicle_id = ?`,
      [plate_number, owner_name, vehicle_type, owner_phone, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Vehicle updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating vehicle" });
  }
};

// Delete vehicle. Drivers can only delete their own; Admins can delete any.
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === "Driver") {
      const [existing] = await db.query(
        "SELECT user_id FROM vehicles WHERE vehicle_id = ?",
        [id]
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      if (existing[0].user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const [result] = await db.query(
      "DELETE FROM vehicles WHERE vehicle_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting vehicle" });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};