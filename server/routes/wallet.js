const express = require("express");
const router = express.Router();
const { getWallet, topUpWallet } = require("../controllers/walletController");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, getWallet);
router.post("/topup", authenticate, topUpWallet);

module.exports = router;