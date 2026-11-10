const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../middleware/auth");

const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  toggleBlacklist,
} = require("../controllers/vehicleController");

// Checks that the logged-in user is allowed to touch the vehicle in :id.
// Admin: everything. Company Admin: own company's vehicles only.
// Driver: own vehicle (or one assigned to them, read-only). Toll Attendant: read-only.
const canAccessVehicle = async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM vehicles WHERE vehicle_id = ?", [req.params.id]);
    const vehicle = rows[0];

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const { role, user_id, company_id } = req.user;
    const isRead = req.method === "GET";

    let allowed = false;

    if (role === "Admin") {
      allowed = true;
    } else if (role === "Company Admin") {
      allowed = !!company_id && vehicle.company_id === company_id;
    } else if (role === "Driver") {
      allowed =
        vehicle.user_id === user_id ||
        (isRead && vehicle.assigned_driver_id === user_id);
    } else if (role === "Toll Attendant") {
      allowed = isRead;
    }

    if (!allowed) {
      return res.status(403).json({ message: "You do not have access to this vehicle" });
    }

    next();
  } catch (err) {
    console.error("Vehicle access check error:", err.message);
    res.status(500).json({ message: "Could not verify vehicle access" });
  }
};

router.get("/", protect, getVehicles);
router.get("/:id", protect, canAccessVehicle, getVehicleById);
router.post("/", protect, createVehicle);
router.put("/:id", protect, canAccessVehicle, updateVehicle);
router.delete("/:id", protect, canAccessVehicle, deleteVehicle);
router.put("/:id/blacklist", protect, toggleBlacklist);

module.exports = router;