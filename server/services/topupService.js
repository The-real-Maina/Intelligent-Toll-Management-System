const db = require("../config/db");

// Credits the company wallet exactly once. The row is locked, so if the M-Pesa
// callback and the status poll arrive at the same time, only one of them credits.
async function creditTopup(topupId, receipt) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      "SELECT * FROM wallet_topups WHERE topup_id = ? FOR UPDATE",
      [topupId]
    );
    const topup = rows[0];

    if (!topup || topup.status !== "pending") {
      await conn.rollback();
      return false;
    }

    await conn.query(
      "UPDATE wallet_topups SET status = 'completed', mpesa_receipt = ?, completed_at = NOW() WHERE topup_id = ?",
      [receipt || null, topupId]
    );
    await conn.query(
      "UPDATE companies SET wallet_balance = wallet_balance + ? WHERE company_id = ?",
      [topup.amount, topup.company_id]
    );
    await conn.query(
      "INSERT INTO wallet_transactions (user_id, company_id, amount, type, description) VALUES (?, ?, ?, 'credit', ?)",
      [
        topup.user_id,
        topup.company_id,
        topup.amount,
        receipt ? `Company wallet top-up (M-Pesa ${receipt})` : "Company wallet top-up (M-Pesa)",
      ]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function failTopup(topupId, reason) {
  await db.query(
    "UPDATE wallet_topups SET status = 'failed', failure_reason = ? WHERE topup_id = ? AND status = 'pending'",
    [String(reason || "Payment failed").slice(0, 250), topupId]
  );
}

module.exports = { creditTopup, failTopup };