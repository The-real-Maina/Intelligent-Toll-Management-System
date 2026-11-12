const express = require("express");
const router = express.Router();
const db = require("../config/db");

// --- CHAT ENDPOINT ---
router.post("/chat", async (req, res) => {
  try {
    const { message, user_name, role } = req.body;
    if (!message) return res.status(400).json({ success: false, reply: "Message is required." });
    const pythonResponse = await fetch("http://127.0.0.1:8001/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, user_name, role }),
    });
    const aiData = await pythonResponse.json();
    res.status(200).json(aiData);
  } catch (error) {
    res.status(500).json({ success: false, reply: "AI server is offline." });
  }
});

// --- REPORT GENERATION ENDPOINT ---
router.post("/generate-report", async (req, res) => {
  try {
    const [vehicleRows] = await db.query("SELECT COUNT(*) AS total FROM vehicles");
    const totalVehicles = vehicleRows[0].total;

    const [revenueRows] = await db.query(`
      SELECT SUM(amount) AS total_revenue,
        SUM(CASE WHEN payment_method = 'Mpesa' THEN amount ELSE 0 END) AS mpesa_revenue,
        SUM(CASE WHEN payment_method != 'Mpesa' THEN amount ELSE 0 END) AS other_revenue
      FROM payments WHERE DATE(payment_date) = CURDATE()
    `);

    let totalRevenue = parseFloat(revenueRows[0].total_revenue) || 0;
    let mpesaRevenue = parseFloat(revenueRows[0].mpesa_revenue) || 0;
    let otherRevenue = parseFloat(revenueRows[0].other_revenue) || 0;
    let peakHour = "No traffic yet today";

    if (totalRevenue === 0) {
      const [allTimeRows] = await db.query(`
        SELECT SUM(amount) AS total_revenue, SUM(CASE WHEN payment_method = 'Mpesa' THEN amount ELSE 0 END) AS mpesa_revenue,
          SUM(CASE WHEN payment_method != 'Mpesa' THEN amount ELSE 0 END) AS other_revenue FROM payments
      `);
      totalRevenue = parseFloat(allTimeRows[0].total_revenue) || 0;
      mpesaRevenue = parseFloat(allTimeRows[0].mpesa_revenue) || 0;
      otherRevenue = parseFloat(allTimeRows[0].other_revenue) || 0;
    }

    const [peakRows] = await db.query(`
      SELECT HOUR(payment_date) AS hour, COUNT(*) as count FROM payments
      GROUP BY HOUR(payment_date) ORDER BY count DESC LIMIT 1
    `);
    if (peakRows.length > 0) peakHour = `${peakRows[0].hour}:00 - ${peakRows[0].hour + 1}:00`;

    const pythonResponse = await fetch("http://127.0.0.1:8001/api/generate-report", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total_vehicles: totalVehicles, total_revenue: totalRevenue,
        mpesa_revenue: mpesaRevenue, cash_revenue: otherRevenue, peak_hour: peakHour
      }),
    });
    const aiData = await pythonResponse.json();
    res.status(200).json(aiData);
  } catch (error) {
    res.status(500).json({ success: false, report: "Failed to generate report." });
  }
});

// --- DRIVER INSIGHT ENDPOINT ---
router.post("/driver-insight", async (req, res) => {
  try {
    const { name, payments } = req.body;

    if (!payments || payments.length === 0) {
      return res.status(200).json({ 
        success: true, 
        insight: `Hey ${name}! You haven't made any toll payments yet. Top up your wallet to get started!` 
      });
    }

    const totalSpent = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const methodCounts = {};
    payments.forEach(p => { 
      methodCounts[p.payment_method] = (methodCounts[p.payment_method] || 0) + 1; 
    });
    const favoriteMethod = Object.keys(methodCounts).reduce((a, b) => methodCounts[a] > methodCounts[b] ? a : b);

    const pythonResponse = await fetch("http://127.0.0.1:8001/api/driver-insight", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driver_name: name, total_spent: totalSpent,
        total_payments: payments.length, favorite_method: favoriteMethod
      }),
    });
    const aiData = await pythonResponse.json();
    res.status(200).json(aiData);
  } catch (error) {
    console.error("❌ Driver Insight Error:", error);
    res.status(200).json({ 
      success: true, 
      insight: `Hey ${req.body.name || "there"}! Keep using ITMS to pay your tolls for a faster, cashless experience.` 
    });
  }
});

// --- DISPUTE SUMMARIZER ENDPOINT ---
router.post("/summarize-dispute", async (req, res) => {
  try {
    const { name, complaint } = req.body;

    if (!complaint) {
      return res.status(400).json({ success: false, summary: "No complaint provided." });
    }

    console.log(`⚖️ Sending dispute from ${name} to AI for summary...`);

    const pythonResponse = await fetch("http://127.0.0.1:8001/api/summarize-dispute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driver_name: name, complaint }),
    });

    const aiData = await pythonResponse.json();
    res.status(200).json(aiData);
  } catch (error) {
    console.error("❌ Dispute Summarizer Error:", error);
    res.status(500).json({ success: false, summary: "AI server failed to summarize." });
  }
});

module.exports = router;