const db = require("../config/db");

// Get all toll booths (only Active ones, for the driver's Pay Now dropdown)
const getTollBooths = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM toll_booths WHERE status = 'Active'"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching toll booths" });
  }
};

// Get one toll booth
const getTollBoothById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM toll_booths WHERE booth_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Toll booth not found",
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching toll booth",
    });
  }
};

module.exports = {
  getTollBooths,
  getTollBoothById,
};