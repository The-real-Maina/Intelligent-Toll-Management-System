const db = require("../config/db");
const bcrypt = require("bcryptjs");

const getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.full_name, u.email, u.phone, u.role, u.created_at, u.company_id, c.name as company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.company_id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT user_id, full_name, email, phone, role, created_at, company_id FROM users WHERE user_id = ?",
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
};

const createUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, company_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, password, role, is_verified, company_id)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [full_name, email, phone, hashedPassword, role, company_id || null]
    );
    res.status(201).json({ message: "User created successfully", user_id: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Email already exists" });
    res.status(500).json({ message: "Error creating user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, role, company_id } = req.body;
    const [result] = await db.query(
      `UPDATE users SET full_name = ?, email = ?, phone = ?, role = ?, company_id = ? WHERE user_id = ?`,
      [full_name, email, phone, role, company_id || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Email already exists" });
    res.status(500).json({ message: "Error updating user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM users WHERE user_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting user" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both passwords required" });
    const [rows] = await db.query("SELECT password FROM users WHERE user_id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) return res.status(401).json({ message: "Current password incorrect" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, id]);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error changing password" });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, changePassword };