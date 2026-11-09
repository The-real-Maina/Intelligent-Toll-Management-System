const db = require("../config/db");

const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const [rows] = await db.query(
      `SELECT p.*, v.plate_number, v.vehicle_type 
       FROM payments p
       LEFT JOIN transactions t ON p.transaction_id = t.transaction_id
       LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
       WHERE p.reference_number = ?`,
      [reference]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "INVALID: Payment not found." });
    }

    // If found, it's a valid payment
    res.json({ 
      message: "VALID: Payment successful.", 
      payment: rows[0] 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during verification." });
  }
};

module.exports = { verifyPayment };