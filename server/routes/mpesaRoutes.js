const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');
const { protect } = require('../middleware/auth');

// Driver initiates payment for a toll transaction
router.post('/stkpush', protect, mpesaController.initiatePayment);

// Safaricom calls this — must be PUBLIC, no auth middleware
router.post('/callback', mpesaController.handleCallback);

// Frontend polls this to check if payment completed
router.get('/status/:checkoutRequestId', protect, mpesaController.checkStatus);

module.exports = router;