const db = require("../config/db");
const { logAction } = require("./auditController");
const { createNotification } = require("./notificationController");

const createDispute = async (req, res) => {
  const { payment_id, reason } = req.body;
  if (!payment_id || !reason) {
    return res.status(400).json({ message: "Payment ID and reason are required." });
  }

  try {
    const [payRows] = await db.query(
      `SELECT p.payment_id, v.user_id 
       FROM payments p
       LEFT JOIN toll_transactions t ON p.transaction_id = t.transaction_id
       LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
       WHERE p.payment_id = ?`,
      [payment_id]
    );

    if (payRows.length === 0) return res.status(404).json({ message: "Payment not found." });
    if (payRows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ message: "You can only dispute your own payments." });
    }

    const [existing] = await db.query(
      "SELECT dispute_id FROM disputes WHERE payment_id = ? AND status = 'Pending'",
      [payment_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "A pending dispute already exists for this payment." });
    }

    await db.query(
      "INSERT INTO disputes (payment_id, user_id, reason) VALUES (?, ?, ?)",
      [payment_id, req.user.user_id, reason]
    );

    await logAction(req.user.user_id, "DISPUTE_CREATED", `Disputed payment #${payment_id}`);

    res.status(201).json({ message: "Dispute submitted successfully." });
  } catch (err) {
    console.error("🚨 DISPUTE ERROR:", err);
    res.status(500).json({ message: "Error creating dispute.", error: err.message });
  }
};

const getMyDisputes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, p.reference_number, p.amount 
       FROM disputes d
       JOIN payments p ON d.payment_id = p.payment_id
       WHERE d.user_id = ?
       ORDER BY d.created_at DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching disputes." });
  }
};

const getAllDisputes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, p.reference_number, p.amount, p.payment_method, u.full_name, u.email
       FROM disputes d
       JOIN payments p ON d.payment_id = p.payment_id
       JOIN users u ON d.user_id = u.user_id
       ORDER BY 
         CASE d.status WHEN 'Pending' THEN 1 WHEN 'Resolved' THEN 2 ELSE 3 END,
         d.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching disputes." });
  }
};

const resolveDispute = async (req, res) => {
  const { id } = req.params;
  const { action, admin_notes } = req.body;

  console.log("🔥 Resolve request:", { id, action, admin_notes }); // Debug log

  if (!["refund", "reject"].includes(action)) {
    return res.status(400).json({ message: "Invalid action. Use 'refund' or 'reject'." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get dispute + payment details
    const [rows] = await conn.query(
      `SELECT d.*, p.amount 
       FROM disputes d 
       JOIN payments p ON d.payment_id = p.payment_id 
       WHERE d.dispute_id = ? AND d.status = 'Pending'`,
      [id]
    );

    console.log("🔥 Found dispute:", rows); // Debug log

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Pending dispute not found." });
    }

    const dispute = rows[0];
    const newStatus = action === "refund" ? "Resolved" : "Rejected";

    // Update dispute
    await conn.query(
      "UPDATE disputes SET status = ?, admin_notes = ?, resolved_at = NOW() WHERE dispute_id = ?",
      [newStatus, admin_notes || null, id]
    );

    // Refund to wallet
    if (action === "refund") {
      await conn.query(
        "UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?",
        [dispute.amount, dispute.user_id]
      );

      await conn.query(
        "INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES (?, ?, 'credit', ?)",
        [dispute.user_id, dispute.amount, `Refund for disputed payment #${dispute.payment_id}`]
      );

      await createNotification(
        dispute.user_id, 
        "Dispute Resolved - Refunded", 
        `Your dispute has been resolved. KES ${dispute.amount} has been refunded to your wallet.`
      );
    } else {
      await createNotification(
        dispute.user_id, 
        "Dispute Rejected", 
        `Your dispute for payment #${dispute.payment_id} was reviewed and rejected.`
      );
    }

    await conn.commit();
    await logAction(req.user.user_id, "DISPUTE_RESOLVED", `Dispute #${id} -> ${newStatus} (${action})`);

    res.json({ message: `Dispute ${newStatus.toLowerCase()} successfully.` });
  } catch (err) {
    await conn.rollback();
    console.error("🚨 RESOLVE ERROR:", err);
    res.status(500).json({ message: "Error resolving dispute.", error: err.message });
  } finally {
    conn.release();
  }
};

module.exports = { createDispute, getMyDisputes, getAllDisputes, resolveDispute };