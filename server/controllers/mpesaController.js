const mpesaService = require('../services/mpesaService');
const db = require('../config/db');

// In-memory map: CheckoutRequestID -> { payment_id, transaction_id, status }
// NOTE: resets on server restart. Fine for sandbox testing; for production
// this should be persisted (e.g. a checkout_request_id column on payments).
const pendingTransactions = new Map();

// Driver initiates an M-Pesa payment for a toll booth.
// Creates the toll_transactions row + a 'pending' payment row, then fires the STK Push.
exports.initiatePayment = async (req, res) => {
  const { vehicle_id, booth_id, amount, phoneNumber } = req.body;

  if (!vehicle_id || !booth_id || !amount || !phoneNumber) {
    return res.status(400).json({
      message: 'vehicle_id, booth_id, amount, and phoneNumber are required',
    });
  }

  // Drivers may only pay for their own vehicle
  if (req.user.role === 'Driver') {
    const [vehicleRows] = await db.query(
      'SELECT user_id FROM vehicles WHERE vehicle_id = ?',
      [vehicle_id]
    );
    if (vehicleRows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    if (vehicleRows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'You can only pay for your own vehicle' });
    }
  }

  const conn = await db.getConnection();
  let payment_id;
  let transaction_id;

  try {
    await conn.beginTransaction();

    // 1. Create the toll_transactions row (vehicle passing this booth)
    //    payment_method here uses 'Mobile Money' — that table's enum doesn't
    //    include 'Mpesa'. payment_status starts 'Pending' until the callback lands.
    const [txResult] = await conn.query(
      `INSERT INTO toll_transactions (vehicle_id, booth_id, amount, payment_method, payment_status)
       VALUES (?, ?, ?, 'Mobile Money', 'Pending')`,
      [vehicle_id, booth_id, amount]
    );
    transaction_id = txResult.insertId;

    // 2. Create the payment row as 'pending' — it becomes 'completed' or
    //    'failed' once the M-Pesa callback arrives
    const [payResult] = await conn.query(
      `INSERT INTO payments (transaction_id, amount, payment_method, status)
       VALUES (?, ?, 'Mpesa', 'pending')`,
      [transaction_id, amount]
    );
    payment_id = payResult.insertId;

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('Error creating pending payment:', err);
    return res.status(500).json({ message: 'Error creating payment record' });
  } finally {
    conn.release();
  }

  // 3. Trigger the STK Push (outside the DB transaction — if this fails,
  //    the payment row stays 'pending' and the driver can retry)
  try {
    const result = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount,
      accountReference: `PAY-${payment_id}`,
      transactionDesc: `Toll payment #${payment_id}`,
    });

    pendingTransactions.set(result.CheckoutRequestID, {
      payment_id,
      transaction_id,
      status: 'pending',
    });

    res.status(200).json({
      message: 'STK Push sent. Check your phone to complete payment.',
      checkoutRequestId: result.CheckoutRequestID,
      payment_id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, payment_id });
  }
};

// Safaricom calls this. Must stay public (no auth middleware).
exports.handleCallback = async (req, res) => {
  const callback = req.body?.Body?.stkCallback;

  if (!callback) {
    return res.status(400).json({ message: 'Invalid callback payload' });
  }

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
  console.log('M-Pesa callback received:', { ResultCode, ResultDesc });
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
          `UPDATE payments
           SET status = 'completed', mpesa_receipt = ?, amount_paid = ?, paid_by_phone = ?, paid_at = NOW()
           WHERE payment_id = ?`,
          [mpesaReceiptNumber, amountPaid, phoneNumber, tracked.payment_id]
        );
        await db.query(
          `UPDATE toll_transactions SET payment_status = 'Paid' WHERE transaction_id = ?`,
          [tracked.transaction_id]
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
          `UPDATE payments SET status = 'failed', failure_reason = ? WHERE payment_id = ?`,
          [ResultDesc, tracked.payment_id]
        );
        await db.query(
          `UPDATE toll_transactions SET payment_status = 'Failed' WHERE transaction_id = ?`,
          [tracked.transaction_id]
        );
        pendingTransactions.set(CheckoutRequestID, { ...tracked, status: 'failed' });
      }
    } catch (dbError) {
      console.error('DB update error on M-Pesa failure:', dbError);
    }
  }

  res.status(200).json({ message: 'Callback received' });
};

// Frontend polls this to check if payment completed
exports.checkStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;
  const tracked = pendingTransactions.get(checkoutRequestId);

  if (!tracked) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  res.status(200).json(tracked);
};