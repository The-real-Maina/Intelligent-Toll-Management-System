console.log("Index.js is running...");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import Routes
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicle");
const tollGateRoutes = require("./routes/tollGate");
const tollBoothRoutes = require("./routes/tollBoothRoutes");
const paymentRoutes = require("./routes/paymentroutes"); // <-- CHANGED TO MATCH YOUR FILE NAME
const settingsRoutes = require("./routes/settings");
const mpesaRoutes = require("./routes/mpesaRoutes");
const rateRoutes = require("./routes/rateRoutes"); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/tollgates", tollGateRoutes);
app.use("/api/tollbooths", tollBoothRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/rates", rateRoutes); 

// Test Route
app.get("/", (req, res) => {
  res.send("🚗 Intelligent Toll Management API is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});