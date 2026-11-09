const db = require("../config/db");

// Get all payments
const getPayments = async (req, res) => {
  try {
    let rows;

    // FIX: Added ?. to prevent crashing if req.user is missing
    if (req.user?.role === "Driver") {
      [rows] = await db.query(
        `SELECT p.*, v.plate_number, v.owner_name
         FROM payments p
         LEFT JOIN transactions t ON p.transaction_id = t.transaction_id
         LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
         WHERE v.user_id = ?
         ORDER BY p.payment_date DESC`,
        [req.user.user_id]
      );
    } else {
      [rows] = await db.query(`
        SELECT p.*, v.plate_number, v.owner_name
        FROM payments p
        LEFT JOIN transactions t ON p.transaction_id = t.transaction_id
        LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        ORDER BY p.payment_date DESC
      `);
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching payments" });
  }
};

// Get one payment
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT p.*, v.plate_number, v.owner_name, v.user_id AS vehicle_owner_id
       FROM payments p
       LEFT JOIN transactions t ON p.transaction_id = t.transaction_id
       LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
       WHERE p.payment_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = rows[0];

    if (req.user?.role === "Driver" && payment.vehicle_owner_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    delete payment.vehicle_owner_id;
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching payment" });
  }
};

// Create payment
const createPayment = async (req, res) => {
  let { vehicle_id, gate_id, reference_number, amount, payment_method } = req.body;

  if (!vehicle_id || !gate_id || !amount) {
    return res.status(400).json({
      message: "vehicle_id, gate_id and amount are required",
    });
  }

  if (req.user?.role === "Driver") {
    const [vehicleRows] = await db.query(
      "SELECT user_id FROM vehicles WHERE vehicle_id = ?",
      [vehicle_id]
    );
    if (vehicleRows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    if (vehicleRows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ message: "You can only pay for your own vehicle" });
    }
  }

  // Sanitize the prefix
  if (!reference_number || reference_number.trim() === "") {
    const methodPrefix = payment_method ? payment_method.toLowerCase().replace(/[^a-z0-9]/g, '') : "txn";
    reference_number = `${methodPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [txResult] = await conn.query(
      `INSERT INTO transactions (vehicle_id, gate_id, amount, status)
       VALUES (?, ?, ?, 'Completed')`,
      [vehicle_id, gate_id, amount]
    );
    const transaction_id = txResult.insertId;

    const [payResult] = await conn.query(
      `INSERT INTO payments (transaction_id, reference_number, amount, payment_method)
       VALUES (?, ?, ?, ?)`,
      [transaction_id, reference_number, amount, payment_method]
    );

    await conn.commit();

    res.status(201).json({
      message: "Payment recorded successfully",
      payment_id: payResult.insertId,
      transaction_id,
      reference_number: reference_number 
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Reference number already exists" });
    }
    res.status(500).json({ message: "Error recording payment" });
  } finally {
    conn.release();
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reference_number, amount, payment_method } = req.body;

    if (req.user?.role === "Driver") {
      const [rows] = await db.query(
        `SELECT v.user_id AS vehicle_owner_id
         FROM payments p
         LEFT JOIN transactions t ON p.transaction_id = t.transaction_id
         LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
         WHERE p.payment_id = ?`,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Payment not found" });
      }
      if (rows[0].vehicle_owner_id !== req.user.user_id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const [result] = await db.query(
      `UPDATE payments SET reference_number = ?, amount = ?, payment_method = ?
       WHERE payment_id = ?`,
      [reference_number || null, amount, payment_method, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ message: "Payment updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating payment" });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user?.role === "Driver") {
      const [rows] = await db.query(
        `SELECT v.user_id AS vehicle_owner_id
         FROM payments p
         LEFT JOIN transactions t ON p.transaction_id = t.transaction_id
         LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
         WHERE p.payment_id = ?`,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Payment not found" });
      }
      if (rows[0].vehicle_owner_id !== req.user.user_id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const [result] = await db.query(
      "DELETE FROM payments WHERE payment_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting payment" });
  }
};

// Verify payment (For Toll Attendant)
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const [rows] = await db.query(
      `SELECT p.*, v.plate_number, v.vehicle_type, u.full_name as owner_name
       FROM payments p
       LEFT JOIN transactions t ON p.transaction_id = t.transaction_id
       LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
       LEFT JOIN users u ON v.user_id = u.user_id
       WHERE p.reference_number = ?`,
      [reference]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "INVALID: Payment not found." });
    }

    res.json({ 
      message: "VALID: Payment successful.", 
      payment: rows[0] 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during verification." });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  verifyPayment
};