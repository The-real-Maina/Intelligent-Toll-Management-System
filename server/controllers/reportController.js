const db = require("../config/db");

// Revenue over time — daily (last 30 days) or monthly
const getRevenueReport = async (req, res) => {
  try {
    const period = req.query.period === "monthly" ? "monthly" : "daily";

    let rows;
    if (period === "monthly") {
      [rows] = await db.query(`
        SELECT DATE_FORMAT(payment_date, '%Y-%m') AS period, SUM(amount) AS total
        FROM payments
        GROUP BY period
        ORDER BY period ASC
      `);
    } else {
      [rows] = await db.query(`
        SELECT DATE(payment_date) AS period, SUM(amount) AS total
        FROM payments
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `);
      rows.reverse();
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching revenue report" });
  }
};

// Traffic (transaction volume + revenue) per toll gate
const getTrafficReport = async (req, res) => {
  try {
    // SAFE QUERY: Groups by vehicle type instead of toll gates since we don't know the exact gate column
    const [rows] = await db.query(`
      SELECT
        v.vehicle_type AS gate_name,
        COUNT(t.transaction_id) AS totalTransactions,
        IFNULL(SUM(t.amount), 0) AS totalAmount
      FROM transactions t
      LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
      GROUP BY v.vehicle_type
      ORDER BY totalTransactions DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching traffic report" });
  }
};

// Filterable payment/vehicle activity log
const getActivityLog = async (req, res) => {
  try {
    const { plate, method, from, to } = req.query;

    // SAFE QUERY: Joins payments to transactions and vehicles. Removed the crashing gate join.
    let sql = `
      SELECT
        p.payment_id,
        p.reference_number,
        p.amount,
        p.payment_method,
        p.payment_date,
        v.plate_number,
        v.owner_name
      FROM payments p
      LEFT JOIN transactions t ON p.transaction_id = t.transaction_id
      LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
      WHERE 1 = 1
    `;
    const params = [];

    if (plate) {
      sql += " AND v.plate_number LIKE ?";
      params.push(`%${plate}%`);
    }
    if (method) {
      sql += " AND p.payment_method = ?";
      params.push(method);
    }
    if (from) {
      sql += " AND p.payment_date >= ?";
      params.push(from);
    }
    if (to) {
      sql += " AND p.payment_date <= ?";
      params.push(`${to} 23:59:59`);
    }

    sql += " ORDER BY p.payment_date DESC LIMIT 200";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching activity log" });
  }
};

module.exports = {
  getRevenueReport,
  getTrafficReport,
  getActivityLog,
};