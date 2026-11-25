const db = require("../config/db");
const { logAction } = require("./auditController");
const mpesaService = require("../services/mpesaService");
const { creditTopup, failTopup } = require("../services/topupService");

const MIN_TOPUP = 1;
const MAX_TOPUP = 150000; // M-Pesa single transaction limit

// Accepts 07XXXXXXXX, 01XXXXXXXX, 7XXXXXXXX, 2547XXXXXXXX, +2547XXXXXXXX
const PHONE_REGEX = /^(\+?254|0)?[17]\d{8}$/;

const getWallet = async (req, res) => {
  try {
    const [userRows] = await db.query("SELECT wallet_balance, company_id FROM users WHERE user_id = ?", [req.user.user_id]);
    const companyId = userRows[0]?.company_id;

    const [history] = await db.query(
      "SELECT * FROM wallet_transactions WHERE user_id = ? OR company_id = ? ORDER BY created_at DESC LIMIT 10",
      [req.user.user_id, companyId]
    );

    let companyBalance = 0;
    if (companyId) {
      const [companyRows] = await db.query("SELECT wallet_balance FROM companies WHERE company_id = ?", [companyId]);
      companyBalance = companyRows[0]?.wallet_balance || 0;
    }

    res.json({
      balance: userRows[0]?.wallet_balance || 0,
      company_balance: companyBalance,
      history
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching wallet" });
  }
};

// Starts a personal wallet top-up. This only sends the STK push and records a
// pending request. The wallet is credited later, once Safaricom confirms payment.
const topUpWallet = async (req, res) => {
  const { amount, phoneNumber } = req.body;

  const numericAmount = Math.round(Number(amount));
  if (!numericAmount || numericAmount < MIN_TOPUP || numericAmount > MAX_TOPUP) {
    return res.status(400).json({
      message: `Enter an amount between KES ${MIN_TOPUP} and KES ${MAX_TOPUP.toLocaleString()}`,
    });
  }

  const cleanPhone = String(phoneNumber || "").replace(/\s+/g, "");
  if (!PHONE_REGEX.test(cleanPhone)) {
    return res.status(400).json({ message: "Enter a valid M-Pesa number, e.g. 0712345678" });
  }

  const formattedPhone = mpesaService.formatPhoneNumber(cleanPhone);

  let topupId;
  try {
    // company_id stays NULL: that is how a personal top-up is told apart from a company one
    const [result] = await db.query(
      "INSERT INTO wallet_topups (user_id, company_id, amount, phone, status) VALUES (?, NULL, ?, ?, 'pending')",
      [req.user.user_id, numericAmount, formattedPhone]
    );
    topupId = result.insertId;
  } catch (err) {
    console.error("Error creating top-up request:", err);
    return res.status(500).json({ message: "Could not start the top-up" });
  }

  try {
    const stk = await mpesaService.initiateSTKPush({
      phoneNumber: cleanPhone,
      amount: numericAmount,
      accountReference: `TOPUP-${topupId}`,
      transactionDesc: "Wallet top-up",
    });

    await db.query("UPDATE wallet_topups SET checkout_request_id = ? WHERE topup_id = ?", [
      stk.CheckoutRequestID,
      topupId,
    ]);

    await logAction(req.user.user_id, "WALLET_TOPUP_REQUESTED", `Requested KES ${numericAmount} top-up via M-Pesa`);

    res.json({
      message: "STK Push sent. Check your phone to complete the top-up.",
      topup_id: topupId,
      checkoutRequestId: stk.CheckoutRequestID,
    });
  } catch (err) {
    await failTopup(topupId, err.message);
    res.status(500).json({ message: err.message || "Could not send the M-Pesa prompt" });
  }
};

// DEMO / TESTING ONLY. Credits the wallet without calling Safaricom.
// It creates a pending top-up row and then runs the same creditTopup() used
// for real payments, so the crediting logic is exercised exactly as in production.
const simulateTopUp = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Simulation is disabled in production" });
  }

  const numericAmount = Math.round(Number(req.body.amount));
  if (!numericAmount || numericAmount < MIN_TOPUP || numericAmount > MAX_TOPUP) {
    return res.status(400).json({
      message: `Enter an amount between KES ${MIN_TOPUP} and KES ${MAX_TOPUP.toLocaleString()}`,
    });
  }

  let topupId;
  try {
    const [result] = await db.query(
      "INSERT INTO wallet_topups (user_id, company_id, amount, phone, status) VALUES (?, NULL, ?, ?, 'pending')",
      [req.user.user_id, numericAmount, "SIMULATED"]
    );
    topupId = result.insertId;
  } catch (err) {
    console.error("Error creating simulated top-up:", err);
    return res.status(500).json({ message: "Could not start the simulation" });
  }

  try {
    await creditTopup(topupId, null);
    await logAction(req.user.user_id, "WALLET_TOPUP_SIMULATED", `Simulated KES ${numericAmount} top-up`);
    res.json({ message: "Simulated top-up successful", topup_id: topupId });
  } catch (err) {
    console.error("Simulated top-up error:", err);
    await failTopup(topupId, err.message);
    res.status(500).json({ message: "Simulation failed" });
  }
};

// The wallet page polls this. If the callback has not arrived yet, we ask
// Safaricom directly, so a top-up is never credited on our own say-so.
const getTopupStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;

  try {
    // Only the user who started the top-up can check it
    const [rows] = await db.query(
      "SELECT topup_id, status, failure_reason FROM wallet_topups WHERE checkout_request_id = ? AND user_id = ?",
      [checkoutRequestId, req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Top-up not found" });
    }

    let { topup_id, status, failure_reason } = rows[0];

    if (status === "pending") {
      const check = await mpesaService.queryStkPush(checkoutRequestId);

      if (check.state === "success") {
        // creditTopup locks the row, so the callback and this poll cannot both credit
        await creditTopup(topup_id, null);
      } else if (check.state === "failed") {
        await failTopup(topup_id, check.resultDesc);
      }

      const [fresh] = await db.query(
        "SELECT status, failure_reason FROM wallet_topups WHERE topup_id = ?",
        [topup_id]
      );
      status = fresh[0].status;
      failure_reason = fresh[0].failure_reason;
    }

    res.json({
      status,
      message: status === "failed" ? failure_reason || "Payment failed" : undefined,
    });
  } catch (err) {
    console.error("Top-up status error:", err);
    res.status(500).json({ message: "Could not check top-up status" });
  }
};

module.exports = { getWallet, topUpWallet, simulateTopUp, getTopupStatus };