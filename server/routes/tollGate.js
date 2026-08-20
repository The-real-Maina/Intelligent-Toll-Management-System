const express = require("express");
const router = express.Router();

const {
  getTollGates,
  getTollGateById,
  createTollGate,
  updateTollGate,
  deleteTollGate,
} = require("../controllers/tollGateController");

router.get("/", getTollGates);
router.get("/:id", getTollGateById);
router.post("/", createTollGate);
router.put("/:id", updateTollGate);
router.delete("/:id", deleteTollGate);

module.exports = router;