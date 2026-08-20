const db = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const [[vehicles]] = await db.query(
      "SELECT COUNT(*) AS totalVehicles FROM vehicles"
    );

    const [[users]] = await db.query(
      "SELECT COUNT(*) AS totalUsers FROM users"
    );

    const [[gates]] = await db.query(
      "SELECT COUNT(*) AS totalTollGates FROM toll_gates"
    );

    const [[payments]] = await db.query(
      "SELECT COUNT(*) AS totalPayments FROM payments"
    );

    const [[revenue]] = await db.query(
      "SELECT IFNULL(SUM(amount),0) AS totalRevenue FROM payments"
    );

    const [recentPayments] = await db.query(`
      SELECT
        reference_number,
        amount,
        payment_method,
        payment_date
      FROM payments
      ORDER BY payment_date DESC
      LIMIT 5
    `);

    res.json({
      totalVehicles: vehicles.totalVehicles,
      totalUsers: users.totalUsers,
      totalTollGates: gates.totalTollGates,
      totalPayments: payments.totalPayments,
      totalRevenue: revenue.totalRevenue,
      recentPayments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};

module.exports = {
  getDashboardStats,
};