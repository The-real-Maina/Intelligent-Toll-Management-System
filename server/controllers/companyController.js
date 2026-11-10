const db = require("../config/db");
const { logAction } = require("./auditController");
const mpesaService = require("../services/mpesaService");
const { creditTopup, failTopup } = require("../services/topupService");

const getMyCompany = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) return res.status(404).json({ message: "No company linked to this account." });

    const [companyRows] = await db.query("SELECT * FROM companies WHERE company_id = ?", [companyId]);
    if (companyRows.length === 0) return res.status(404).json({ message: "Company not found." });

    const [vehicles] = await db.query("SELECT * FROM vehicles WHERE company_id = ?", [companyId]);

    const [payments] = await db.query(
      `SELECT p.*, v.plate_number, g.gate_name
       FROM payments p
       LEFT JOIN toll_transactions t ON p.transaction_id = t.transaction_id
       LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
       LEFT JOIN toll_gates g ON t.booth_id = g.gate_id
       WHERE v.company_id = ?
       ORDER BY p.payment_date DESC LIMIT 50`,
      [companyId]
    );

    res.json({ company: companyRows[0], vehicles, payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching company data." });
  }
};

const addCompanyVehicle = async (req, res) => {
  const { plate_number, owner_name, vehicle_type, owner_phone } = req.body;
  const companyId = req.user.company_id;

  if (!companyId) return res.status(403).json({ message: "No company linked to this account." });
  if (!plate_number || !vehicle_type) return res.status(400).json({ message: "Plate and type required." });

  try {
    const [result] = await db.query(
      `INSERT INTO vehicles (plate_number, owner_name, vehicle_type, owner_phone, user_id, company_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [plate_number, owner_name || "Company Fleet", vehicle_type, owner_phone, req.user.user_id, companyId]
    );
    await logAction(req.user.user_id, "FLEET_VEHICLE_ADDED", `Added ${plate_number} to company #${companyId}`);
    res.status(201).json({ message: "Vehicle added to fleet.", vehicle_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Plate number already exists." });
    res.status(500).json({ message: "Error adding vehicle.", error: err.message });
  }
};

const topUpCompanyWallet = async (req, res) => {
  const { amount, phoneNumber } = req.body;
  const companyId = req.user.company_id;
  const value = Number(amount);

  if (!companyId) return res.status(403).json({ message: "No company linked." });
  if (!Number.isFinite(value) || value < 1 || value > 150000) {
    return res.status(400).json({ message: "Amount must be between KES 1 and 150,000." });
  }
  if (!phoneNumber) return res.status(400).json({ message: "M-Pesa phone number is required." });

  const cleanAmount = Math.round(value);
  let topupId;

  try {
    const [result] = await db.query(
      "INSERT INTO wallet_topups (company_id, user_id, amount, phone) VALUES (?, ?, ?, ?)",
      [companyId, req.user.user_id, cleanAmount, phoneNumber]
    );
    topupId = result.insertId;

    const stk = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount: cleanAmount,
      accountReference: `TOPUP-${topupId}`,
      transactionDesc: "Company wallet top-up",
    });

    await db.query(
      "UPDATE wallet_topups SET checkout_request_id = ? WHERE topup_id = ?",
      [stk.CheckoutRequestID, topupId]
    );

    res.json({
      message: "M-Pesa prompt sent. Enter your PIN on your phone to complete the top-up.",
      checkoutRequestId: stk.CheckoutRequestID,
    });
  } catch (err) {
    if (topupId) await failTopup(topupId, err.message);
    console.error("Top-up error:", err.message);
    res.status(500).json({ message: err.message || "Could not start M-Pesa payment." });
  }
};

const simulateCompanyTopup = async (req, res) => {
  const { amount } = req.body;
  const companyId = req.user.company_id;
  const value = Number(amount);

  if (!companyId) return res.status(403).json({ message: "No company linked." });
  if (!Number.isFinite(value) || value < 1) {
    return res.status(400).json({ message: "Invalid amount." });
  }

  const cleanAmount = Math.round(value);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      "UPDATE companies SET wallet_balance = wallet_balance + ? WHERE company_id = ?",
      [cleanAmount, companyId]
    );
    await conn.query(
      "INSERT INTO wallet_transactions (user_id, company_id, amount, type, description) VALUES (?, ?, ?, 'credit', ?)",
      [req.user.user_id, companyId, cleanAmount, `Simulated top-up of KES ${cleanAmount}`]
    );
    await conn.commit();
    await logAction(req.user.user_id, "COMPANY_WALLET_TOPUP_SIMULATED", `Simulated top-up of KES ${cleanAmount}`);
    res.json({ message: `🧪 Simulated top-up: KES ${cleanAmount} added to company wallet.` });
  } catch (err) {
    await conn.rollback();
    console.error("Simulate top-up error:", err.message);
    res.status(500).json({ message: "Error simulating top-up.", error: err.message });
  } finally {
    conn.release();
  }
};

const getTopupStatus = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT topup_id, status, checkout_request_id,
              TIMESTAMPDIFF(SECOND, created_at, NOW()) AS age_seconds
       FROM wallet_topups
       WHERE checkout_request_id = ? AND company_id = ?`,
      [req.params.checkoutRequestId, req.user.company_id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Top-up not found." });

    const topup = rows[0];

    if (topup.status === "pending" && topup.age_seconds >= 10) {
      const check = await mpesaService.queryStkPush(topup.checkout_request_id);
      if (check.state === "success") {
        await creditTopup(topup.topup_id, null);
      } else if (check.state === "failed") {
        await failTopup(topup.topup_id, check.resultDesc);
      }
    }

    const [fresh] = await db.query(
      "SELECT status, mpesa_receipt, failure_reason FROM wallet_topups WHERE topup_id = ?",
      [topup.topup_id]
    );

    res.json({
      status: fresh[0].status,
      receipt: fresh[0].mpesa_receipt,
      reason: fresh[0].failure_reason,
    });
  } catch (err) {
    console.error("Top-up status error:", err.message);
    res.status(500).json({ message: "Could not check top-up status." });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*,
        (SELECT full_name FROM users WHERE company_id = c.company_id AND role = 'Company Admin' LIMIT 1) as admin_name,
        (SELECT email FROM users WHERE company_id = c.company_id AND role = 'Company Admin' LIMIT 1) as admin_email
      FROM companies c
      ORDER BY 
        CASE c.status WHEN 'Pending' THEN 1 WHEN 'Approved' THEN 2 ELSE 3 END,
        c.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching companies." });
  }
};

const updateCompanyStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be Approved or Rejected." });
  }

  try {
    const [result] = await db.query(
      "UPDATE companies SET status = ?, approved_at = NOW() WHERE company_id = ?",
      [status, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Company not found." });

    await logAction(req.user.user_id, `COMPANY_${status.toUpperCase()}`, `Company #${id} was ${status}.`);
    res.json({ message: `Company ${status.toLowerCase()}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating status." });
  }
};

const createCompany = async (req, res) => {
  const { name, registration_number, email, phone } = req.body;
  if (!name || !registration_number) return res.status(400).json({ message: "Name and reg number required." });

  try {
    const [result] = await db.query(
      "INSERT INTO companies (name, registration_number, email, phone, status) VALUES (?, ?, ?, ?, 'Approved')",
      [name, registration_number, email, phone]
    );
    await logAction(req.user.user_id, "COMPANY_CREATED", `Created company ${name} (auto-approved)`);
    res.status(201).json({ message: "Company created.", company_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Registration number already exists." });
    res.status(500).json({ message: "Error creating company.", error: err.message });
  }
};

module.exports = {
  getMyCompany,
  addCompanyVehicle,
  topUpCompanyWallet,
  simulateCompanyTopup,
  getTopupStatus,
  getAllCompanies,
  updateCompanyStatus,
  createCompany,
};