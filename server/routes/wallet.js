const express = require("express");
const router = express.Router();
const {
  getWallet,
  topUpWallet,
  getTopupStatus,
  simulateTopUp,
} = require("../controllers/walletController");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, getWallet);
router.post("/topup", authenticate, topUpWallet);
router.post("/topup/simulate", authenticate, simulateTopUp);
router.get("/topup/status/:checkoutRequestId", authenticate, getTopupStatus);

module.exports = router;