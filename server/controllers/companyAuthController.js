const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { logAction } = require("./auditController");

const registerCompany = async (req, res) => {
  const {
    company_name, registration_number, company_email, company_phone,
    admin_full_name, admin_email, admin_phone, admin_password,
  } = req.body;

  if (!company_name || !registration_number || !admin_full_name || !admin_email || !admin_password) {
    return res.status(400).json({ message: "All required fields must be filled." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existingCompany] = await conn.query(
      "SELECT company_id FROM companies WHERE registration_number = ?",
      [registration_number]
    );
    if (existingCompany.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: "This registration number is already registered." });
    }

    const [existingUser] = await conn.query(
      "SELECT user_id FROM users WHERE email = ?",
      [admin_email]
    );
    if (existingUser.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: "This email is already registered." });
    }

    const [companyResult] = await conn.query(
      "INSERT INTO companies (name, registration_number, email, phone, status) VALUES (?, ?, ?, ?, 'Pending')",
      [company_name, registration_number, company_email, company_phone]
    );
    const companyId = companyResult.insertId;

    const hashedPassword = await bcrypt.hash(admin_password, 10);
    const [userResult] = await conn.query(
      `INSERT INTO users (full_name, email, phone, password, role, is_verified, company_id)
       VALUES (?, ?, ?, ?, 'Company Admin', 1, ?)`,
      [admin_full_name, admin_email, admin_phone || null, hashedPassword, companyId]
    );

    await conn.commit();
    await logAction(userResult.insertId, "COMPANY_REGISTERED", `${company_name} registered (company #${companyId}).`);

    res.status(201).json({
      message: "Company registered. An ITMS Admin will approve your account shortly.",
      company_id: companyId,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Company registration error:", err);
    res.status(500).json({ message: "Registration failed.", error: err.message });
  } finally {
    conn.release();
  }
};

const checkCompanyStatus = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.status FROM companies c
       JOIN users u ON c.company_id = u.company_id
       WHERE u.email = ? AND u.role = 'Company Admin'`,
      [req.params.email]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Company not found." });
    res.json({ status: rows[0].status });
  } catch (err) {
    res.status(500).json({ message: "Error checking status." });
  }
};

module.exports = { registerCompany, checkCompanyStatus };