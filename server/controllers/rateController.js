const db = require("../config/db");

const getRate = async (req, res) => {
  try {
    const { gate_id, vehicle_type } = req.params;
    const [rows] = await db.query(
      "SELECT amount FROM toll_rates WHERE gate_id = ? AND vehicle_type = ?",
      [gate_id, vehicle_type]
    );

    if (rows.length === 0) {
      // Fallback: use a default price if no specific rate is configured
      const defaultRates = { Car: 150, Motorcycle: 50, Bus: 300, Truck: 600 };
      const fallbackAmount = defaultRates[vehicle_type] || 150;
      return res.json({ amount: fallbackAmount, is_fallback: true });
    }

    res.json({ amount: rows[0].amount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRate };