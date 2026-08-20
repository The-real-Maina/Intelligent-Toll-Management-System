const db = require("../config/db");

// Get all toll gates
const getTollGates = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM toll_gates");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching toll gates" });
  }
};

// Get one toll gate
const getTollGateById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM toll_gates WHERE gate_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Toll gate not found",
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching toll gate",
    });
  }
};

// Create toll gate
const createTollGate = async (req, res) => {
  try {
    const {
      gate_name,
      location,
      road_name,
      status,
      rate,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO toll_gates
      (gate_name, location, road_name, status, rate)
      VALUES (?, ?, ?, ?, ?)`,
      [
        gate_name,
        location,
        road_name,
        status,
        rate ?? 0,
      ]
    );

    res.status(201).json({
      message: "Toll gate added successfully",
      gate_id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error creating toll gate",
    });
  }
};

// Update toll gate
const updateTollGate = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      gate_name,
      location,
      road_name,
      status,
      rate,
    } = req.body;

    const [result] = await db.query(
      `UPDATE toll_gates
      SET
      gate_name=?,
      location=?,
      road_name=?,
      status=?,
      rate = COALESCE(?, rate)
      WHERE gate_id=?`,
      [
        gate_name,
        location,
        road_name,
        status,
        rate ?? null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Toll gate not found",
      });
    }

    res.json({
      message: "Toll gate updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating toll gate",
    });
  }
};

// Delete toll gate
const deleteTollGate = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM toll_gates WHERE gate_id=?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Toll gate not found",
      });
    }

    res.json({
      message: "Toll gate deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error deleting toll gate",
    });
  }
};

module.exports = {
  getTollGates,
  getTollGateById,
  createTollGate,
  updateTollGate,
  deleteTollGate,
};