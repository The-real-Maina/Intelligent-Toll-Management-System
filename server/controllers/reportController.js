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
    const [rows] = await db.query(`
      SELECT
        g.gate_id,
        g.gate_name,
        COUNT(t.transaction_id) AS totalTransactions,
        IFNULL(SUM(t.amount), 0) AS totalAmount
      FROM toll_gates g
      LEFT JOIN transactions t ON t.gate_id = g.gate_id
      GROUP BY g.gate_id, g.gate_name
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
    const { plate, gate_id, method, from, to } = req.query;

    let sql = `
      SELECT
        p.payment_id,
        p.reference_number,
        p.amount,
        p.payment_method,
        p.payment_date,
        v.plate_number,
        v.owner_name,
        g.gate_name
      FROM payments p
      LEFT JOIN transactions t ON p.transaction_id = t.transaction_id
      LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
      LEFT JOIN toll_gates g ON t.gate_id = g.gate_id
      WHERE 1 = 1
    `;
    const params = [];

    if (plate) {
      sql += " AND v.plate_number LIKE ?";
      params.push(`%${plate}%`);
    }
    if (gate_id) {
      sql += " AND g.gate_id = ?";
      params.push(gate_id);
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