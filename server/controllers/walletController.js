const db = require("../config/db");
const { logAction } = require("./auditController");

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

const topUpWallet = async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?",
      [amount, req.user.user_id]
    );

    await conn.query(
      "INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES (?, ?, 'credit', 'Wallet Top-Up via M-Pesa')",
      [req.user.user_id, amount]
    );

    await conn.commit();
    await logAction(req.user.user_id, "WALLET_TOPUP", `Topped up KES ${amount}`);
    res.json({ message: "Wallet topped up successfully!" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Error topping up wallet" });
  } finally {
    conn.release();
  }
};

module.exports = { getWallet, topUpWallet };