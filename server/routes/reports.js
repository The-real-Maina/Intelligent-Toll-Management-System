const express = require("express");
const router = express.Router();

const {
  getRevenueReport,
  getTrafficReport,
  getActivityLog,
} = require("../controllers/reportController");

// Routes for the charts and tables
router.get("/revenue", getRevenueReport);
router.get("/traffic", getTrafficReport);
router.get("/activity", getActivityLog);

module.exports = router;