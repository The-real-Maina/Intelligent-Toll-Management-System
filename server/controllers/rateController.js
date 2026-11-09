const db = require("../config/db");

const getRate = async (req, res) => {
  try {
    const { gate_id, vehicle_type } = req.params;
    const [rows] = await db.query(
      "SELECT amount FROM toll_rates WHERE gate_id = ? AND vehicle_type = ?",
      [gate_id, vehicle_type]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Rate not found" });
    res.json({ amount: rows[0].amount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRate };