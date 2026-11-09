const express = require("express");
const router = express.Router();
const rateController = require("../controllers/rateController");

// Routes
router.get("/:gate_id/:vehicle_type", rateController.getRate);

module.exports = router;