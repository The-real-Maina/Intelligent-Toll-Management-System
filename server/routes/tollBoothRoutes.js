const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");

const {
  getTollBooths,
  getTollBoothById,
} = require("../controllers/tollBoothController");

router.get("/", protect, getTollBooths);
router.get("/:id", protect, getTollBoothById);

module.exports = router;