const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");

const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");

// All vehicle routes require a logged-in user (getVehicles/getVehicleById
// use req.user.role to filter Driver vs Admin access)
router.get("/", protect, getVehicles);
router.get("/:id", protect, getVehicleById);
router.post("/", protect, createVehicle);
router.put("/:id", protect, updateVehicle);
router.delete("/:id", protect, deleteVehicle);

module.exports = router;