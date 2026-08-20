const mpesaService = require('../services/mpesaService');
const db = require('../config/db');

const pendingTransactions = new Map();

exports.initiatePayment = async (req, res) => {
  const { phoneNumber, amount, tollTransactionId } = req.body;

  if (!phoneNumber || !amount || !tollTransactionId) {
    return res.status(400).json({ message: 'phoneNumber, amount, and tollTransactionId are required' });
  }

  try {
    const result = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount,
      accountReference: `TOLL-${tollTransactionId}`,
      transactionDesc: `Toll payment #${tollTransactionId}`,
    });

    pendingTransactions.set(result.CheckoutRequestID, {
      tollTransactionId,
      status: 'pending',
    });

    res.status(200).json({
      message: 'STK Push sent. Check your phone to complete payment.',
      checkoutRequestId: result.CheckoutRequestID,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.handleCallback = async (req, res) => {
  const callback = req.body?.Body?.stkCallback;

  if (!callback) {
    return res.status(400).json({ message: 'Invalid callback payload' });
  }

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
  const tracked = pendingTransactions.get(CheckoutRequestID);

  if (ResultCode === 0) {
    const metadata = {};
    CallbackMetadata.Item.forEach((item) => {
      metadata[item.Name] = item.Value;
    });

    const mpesaReceiptNumber = metadata.MpesaReceiptNumber;
    const amountPaid = metadata.Amount;
    const phoneNumber = metadata.PhoneNumber;

    try {
      if (tracked) {
        await db.query(
          `UPDATE payments SET status = 'completed', mpesa_receipt = ?, amount_paid = ?, paid_by_phone = ?, paid_at = NOW()
           WHERE id = ?`,
          [mpesaReceiptNumber, amountPaid, phoneNumber, tracked.tollTransactionId]
        );
        pendingTransactions.set(CheckoutRequestID, { ...tracked, status: 'completed' });
      }
    } catch (dbError) {
      console.error('DB update error on M-Pesa success:', dbError);
    }
  } else {
    try {
      if (tracked) {
        await db.query(
          `UPDATE payments SET status = 'failed', failure_reason = ? WHERE id = ?`,
          [ResultDesc, tracked.tollTransactionId]
        );
        pendingTransactions.set(CheckoutRequestID, { ...tracked, status: 'failed' });
      }
    } catch (dbError) {
      console.error('DB update error on M-Pesa failure:', dbError);
    }
  }

  res.status(200).json({ message: 'Callback received' });
};

exports.checkStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;
  const tracked = pendingTransactions.get(checkoutRequestId);

  if (!tracked) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  res.status(200).json(tracked);
};