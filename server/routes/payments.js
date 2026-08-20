const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");

const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentController");

router.get("/", protect, getPayments);
router.get("/:id", protect, getPaymentById);
router.post("/", protect, createPayment);
router.put("/:id", protect, updatePayment);
router.delete("/:id", protect, deletePayment);

module.exports = router;