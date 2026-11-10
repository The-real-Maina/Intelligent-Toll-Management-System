const express = require("express");
const router = express.Router();
const { createDispute, getMyDisputes, getAllDisputes, resolveDispute } = require("../controllers/disputeController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, createDispute);
router.get("/my", authenticate, getMyDisputes);
router.get("/all", authenticate, getAllDisputes);
router.put("/:id/resolve", authenticate, resolveDispute);

module.exports = router;