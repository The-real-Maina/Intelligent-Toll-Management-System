const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const db = require("../config/db"); // Needed for the search route

// Safely import the middleware
let authModule;
try {
  authModule = require("../middleware/auth");
} catch (e) {
  authModule = require("../middleware/authMiddleware");
}
const authenticate = authModule.authenticate || authModule;

// ==========================================
// NEW: Inline search route with Audit Log
// ==========================================
router.get("/search/vehicle/:plate", authenticate, async (req, res) => {
  try {
    const { plate } = req.params;
    const [rows] = await db.query(
      `SELECT v.*, u.full_name as owner_name 
       FROM vehicles v 
       LEFT JOIN users u ON v.user_id = u.user_id 
       WHERE v.plate_number LIKE ?`,
      [`%${plate}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error searching vehicle" });
  }
});

// ==========================================
// Standard routes
// ==========================================
router.get("/verify/:reference", paymentController.verifyPayment);
router.post("/cash", paymentController.recordCashPayment);
router.get("/", authenticate, paymentController.getPayments);
router.get("/:id", authenticate, paymentController.getPaymentById);
router.post("/", authenticate, paymentController.createPayment);
router.put("/:id", authenticate, paymentController.updatePayment);
router.delete("/:id", authenticate, paymentController.deletePayment);

module.exports = router;