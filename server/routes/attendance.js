const express = require("express");
const router = express.Router();
const { clockIn, clockOut, getMyShift, getAllAttendance } = require("../controllers/attendanceController");
const { authenticate } = require("../middleware/auth");

router.post("/clock-in", authenticate, clockIn);
router.post("/clock-out", authenticate, clockOut);
router.get("/my-shift", authenticate, getMyShift);
router.get("/all", authenticate, getAllAttendance);

module.exports = router;