const db = require("../config/db");
const { logAction } = require("./auditController");
const { createNotification } = require("./notificationController");

const getPayments = async (req, res) => {
  try {
    let rows;
    if (req.user?.role === "Driver") {
      [rows] = await db.query(
        `SELECT p.*, v.plate_number, v.owner_name, g.gate_name
         FROM payments p
         LEFT JOIN toll_transactions t ON p.transaction_id = t.transaction_id
         LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
         LEFT JOIN toll_gates g ON t.booth_id = g.gate_id
         WHERE v.user_id = ? OR v.company_id = ?
         ORDER BY p.payment_date DESC`,
        [req.user.user_id, req.user.company_id]
      );
    } else {
      [rows] = await db.query(`
        SELECT p.*, v.plate_number, v.owner_name, g.gate_name
        FROM payments p
        LEFT JOIN toll_transactions t ON p.transaction_id = t.transaction_id
        LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        LEFT JOIN toll_gates g ON t.booth_id = g.gate_id
        ORDER BY p.payment_date DESC
      `);
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching payments" });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT p.*, v.plate_number, v.owner_name, v.user_id AS vehicle_owner_id, v.company_id AS vehicle_company_id, g.gate_name
       FROM payments p
       LEFT JOIN toll_transactions t ON p.transaction_id = t.transaction_id
       LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
       LEFT JOIN toll_gates g ON t.booth_id = g.gate_id
       WHERE p.payment_id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Payment not found" });
    const payment = rows[0];
    if (req.user?.role === "Driver" && payment.vehicle_owner_id !== req.user.user_id && payment.vehicle_company_id !== req.user.company_id) {
      return res.status(403).json({ message: "Access denied" });
    }
    delete payment.vehicle_owner_id;
    delete payment.vehicle_company_id;
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching payment" });
  }
};

const createPayment = async (req, res) => {
  let { vehicle_id, gate_id, reference_number, amount, payment_method } = req.body;
  payment_method = payment_method ? payment_method.trim() : "Mpesa";

  if (!vehicle_id || !gate_id || !amount) {
    return res.status(400).json({ message: "vehicle_id, gate_id and amount are required" });
  }

  if (req.user?.role === "Driver") {
    const [vehicleRows] = await db.query("SELECT user_id, company_id, is_blacklisted FROM vehicles WHERE vehicle_id = ?", [vehicle_id]);
    if (vehicleRows.length === 0) return res.status(404).json({ message: "Vehicle not found" });
    const v = vehicleRows[0];
    if (v.user_id !== req.user.user_id && v.company_id !== req.user.company_id) {
      return res.status(403).json({ message: "You can only pay for your own or your company's vehicles" });
    }
    if (v.is_blacklisted) {
      return res.status(403).json({ message: "This vehicle is blacklisted. Contact admin." });
    }
  }

  if (!reference_number || reference_number.trim() === "") {
    const methodPrefix = payment_method.toLowerCase().replace(/[^a-z0-9]/g, '');
    reference_number = `${methodPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 🟢 WALLET DEDUCTION
    if (payment_method === "Wallet" && req.user?.role === "Driver") {
      // Look up the vehicle to see if it's a company vehicle
      const [vehRows] = await conn.query("SELECT company_id FROM vehicles WHERE vehicle_id = ?", [vehicle_id]);
      const companyId = vehRows[0]?.company_id;

      if (companyId) {
        // 🏢 Deduct from COMPANY wallet
        const [companyRows] = await conn.query("SELECT wallet_balance FROM companies WHERE company_id = ?", [companyId]);
        const companyBalance = parseFloat(companyRows[0]?.wallet_balance || 0);

        if (companyBalance < amount) {
          await conn.rollback();
          return res.status(400).json({ message: `Insufficient company wallet balance. Company has KES ${companyBalance.toFixed(2)}` });
        }

        await conn.query(
          "UPDATE companies SET wallet_balance = wallet_balance - ? WHERE company_id = ?",
          [amount, companyId]
        );

        await conn.query(
          "INSERT INTO wallet_transactions (user_id, company_id, amount, type, description) VALUES (?, ?, ?, 'debit', ?)",
          [req.user.user_id, companyId, amount, `Fleet toll payment at Gate ID ${gate_id}`]
        );
      } else {
        // 👤 Deduct from DRIVER personal wallet
        const [userRows] = await conn.query("SELECT wallet_balance FROM users WHERE user_id = ?", [req.user.user_id]);
        const currentBalance = parseFloat(userRows[0]?.wallet_balance || 0);

        if (currentBalance < amount) {
          await conn.rollback();
          return res.status(400).json({ message: `Insufficient wallet balance. You have KES ${currentBalance.toFixed(2)}` });
        }

        await conn.query(
          "UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?",
          [amount, req.user.user_id]
        );

        await conn.query(
          "INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES (?, ?, 'debit', ?)",
          [req.user.user_id, amount, `Toll payment at Gate ID ${gate_id}`]
        );
      }
    }

    const [txResult] = await conn.query(
      `INSERT INTO toll_transactions (vehicle_id, booth_id, amount, payment_status)
       VALUES (?, ?, ?, 'Paid')`,
      [vehicle_id, gate_id, amount]
    );
    const transaction_id = txResult.insertId;

    const [payResult] = await conn.query(
      `INSERT INTO payments (transaction_id, reference_number, amount, payment_method, status)
       VALUES (?, ?, ?, ?, 'completed')`,
      [transaction_id, reference_number, amount, payment_method]
    );

    await conn.commit();

    await logAction(req.user?.user_id || null, "PAYMENT_MADE", `Paid KES ${amount} via ${payment_method}`);
    await createNotification(req.user?.user_id || null, "Payment Successful", `Your payment of KES ${amount} was recorded. Ref: ${reference_number}`);

    res.status(201).json({
      message: "Payment recorded successfully",
      payment_id: payResult.insertId,
      transaction_id,
      reference_number
    });

  } catch (err) {
    await conn.rollback();
    console.error("🚨 PAYMENT ERROR:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Reference number already exists" });
    }
    res.status(500).json({ message: "Payment failed", error: err.message });
  } finally {
    conn.release();
  }
};

const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reference_number, amount, payment_method } = req.body;
    const [result] = await db.query(
      `UPDATE payments SET reference_number = ?, amount = ?, payment_method = ? WHERE payment_id = ?`,
      [reference_number || null, amount, payment_method, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Payment not found" });
    res.json({ message: "Payment updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating payment" });
  }
};

const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM payments WHERE payment_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Payment not found" });
    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting payment" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const [rows] = await db.query(
      `SELECT p.*, v.plate_number, v.vehicle_type, u.full_name as owner_name, v.is_blacklisted, v.blacklist_reason
       FROM payments p
       LEFT JOIN toll_transactions t ON p.transaction_id = t.transaction_id
       LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
       LEFT JOIN users u ON v.user_id = u.user_id
       WHERE p.reference_number = ?`,
      [reference]
    );
    if (rows.length === 0) return res.status(404).json({ message: "INVALID: Payment not found." });
    const payment = rows[0];
    if (payment.is_blacklisted) {
      return res.status(403).json({ message: `🚨 BLACKLISTED VEHICLE: ${payment.blacklist_reason || "Contact Admin"}. Do NOT allow passage.` });
    }
    res.json({ message: "VALID: Payment successful.", payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during verification." });
  }
};

const recordCashPayment = async (req, res) => {
  const { plate_number, gate_id, amount } = req.body;
  if (!plate_number || !gate_id || !amount) {
    return res.status(400).json({ message: "Plate number, gate, and amount are required." });
  }
  try {
    const [vehicleRows] = await db.query(
      "SELECT vehicle_id, user_id, is_blacklisted, blacklist_reason FROM vehicles WHERE plate_number = ?",
      [plate_number]
    );
    if (vehicleRows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found in system. Please register it first." });
    }
    const vehicle = vehicleRows[0];
    if (vehicle.is_blacklisted) {
      return res.status(403).json({ message: `🚨 BLACKLISTED VEHICLE: ${vehicle.blacklist_reason || "Contact Admin"}. Do NOT allow passage.` });
    }
    const reference_number = `cash-${Math.floor(100000 + Math.random() * 900000)}`;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [txResult] = await conn.query(
        `INSERT INTO toll_transactions (vehicle_id, booth_id, amount, payment_status) VALUES (?, ?, ?, 'Paid')`,
        [vehicle.vehicle_id, gate_id, amount]
      );
      const transaction_id = txResult.insertId;
      await conn.query(
        `INSERT INTO payments (transaction_id, reference_number, amount, payment_method, status) VALUES (?, ?, ?, 'Cash', 'completed')`,
        [transaction_id, reference_number, amount]
      );
      await conn.commit();
      await logAction(req.user?.user_id || null, "CASH_PAYMENT", `Recorded cash of KES ${amount} for ${plate_number}`);
      res.status(201).json({ message: "Cash payment recorded successfully", reference_number, plate_number, amount });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error recording cash payment" });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  verifyPayment,
  recordCashPayment,
};