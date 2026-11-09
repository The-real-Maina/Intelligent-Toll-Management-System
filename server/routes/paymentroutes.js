const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Safely import the middleware
let authModule;
try {
  authModule = require("../middleware/auth");
} catch (e) {
  authModule = require("../middleware/authMiddleware");
}
const authenticate = authModule.authenticate || authModule;

// Routes
router.get("/verify/:reference", paymentController.verifyPayment);
router.get("/", authenticate, paymentController.getPayments);
router.get("/:id", authenticate, paymentController.getPaymentById);
router.post("/", authenticate, paymentController.createPayment);
router.put("/:id", authenticate, paymentController.updatePayment);
router.delete("/:id", authenticate, paymentController.deletePayment);

module.exports = router;