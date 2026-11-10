const db = require("../config/db");
const { logAction } = require("./auditController");

// Company Admin: Get my company details + vehicles + payments
const getMyCompany = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) return res.status(404).json({ message: "No company linked to this account." });

    const [companyRows] = await db.query("SELECT * FROM companies WHERE company_id = ?", [companyId]);
    if (companyRows.length === 0) return res.status(404).json({ message: "Company not found." });

    const [vehicles] = await db.query(
      "SELECT * FROM vehicles WHERE company_id = ?",
      [companyId]
    );

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

    res.json({
      company: companyRows[0],
      vehicles,
      payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching company data." });
  }
};

// Company Admin: Add a vehicle to the company fleet
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

// Company Admin: Top up company wallet
const topUpCompanyWallet = async (req, res) => {
  const { amount } = req.body;
  const companyId = req.user.company_id;
  if (!companyId) return res.status(403).json({ message: "No company linked." });
  if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount." });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      "UPDATE companies SET wallet_balance = wallet_balance + ? WHERE company_id = ?",
      [amount, companyId]
    );
    await conn.query(
      "INSERT INTO wallet_transactions (user_id, company_id, amount, type, description) VALUES (?, ?, ?, 'credit', ?)",
      [req.user.user_id, companyId, amount, `Company wallet top-up`]
    );
    await conn.commit();
    res.json({ message: "Company wallet topped up successfully." });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Error topping up.", error: err.message });
  } finally {
    conn.release();
  }
};

// Admin: Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM companies ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching companies." });
  }
};

// Admin: Create a new company
const createCompany = async (req, res) => {
  const { name, registration_number, email, phone } = req.body;
  if (!name || !registration_number) return res.status(400).json({ message: "Name and reg number required." });

  try {
    const [result] = await db.query(
      "INSERT INTO companies (name, registration_number, email, phone) VALUES (?, ?, ?, ?)",
      [name, registration_number, email, phone]
    );
    await logAction(req.user.user_id, "COMPANY_CREATED", `Created company ${name}`);
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
  getAllCompanies,
  createCompany
};