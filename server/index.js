console.log("Index.js is running...");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicle");
const tollGateRoutes = require("./routes/tollGate");
const tollBoothRoutes = require("./routes/tollBoothRoutes");
const paymentRoutes = require("./routes/paymentroutes"); 
const settingsRoutes = require("./routes/settings");
const mpesaRoutes = require("./routes/mpesaRoutes");
const rateRoutes = require("./routes/rateRoutes"); 
const reportRoutes = require("./routes/reports"); 
const auditRoutes = require("./routes/audit"); 
const notificationRoutes = require("./routes/notifications"); 
const attendanceRoutes = require("./routes/attendance"); 
const walletRoutes = require("./routes/wallet");
const disputeRoutes = require("./routes/disputes");
const companyRoutes = require("./routes/companies");
const companyDriverRoutes = require("./routes/companyDrivers");

const app = express();

app.use(cors());
app.use(express.json());

// Company drivers: mounted BEFORE the general routes so nothing like /:id can swallow them
app.use("/api/users/company-drivers", companyDriverRoutes);
app.use("/api/companies/drivers", companyDriverRoutes);

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/tollgates", tollGateRoutes);
app.use("/api/tollbooths", tollBoothRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/rates", rateRoutes); 
app.use("/api/reports", reportRoutes); 
app.use("/api/audit", auditRoutes); 
app.use("/api/notifications", notificationRoutes); 
app.use("/api/attendance", attendanceRoutes); 
app.use("/api/wallet", walletRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/companies", companyRoutes);

app.get("/", (req, res) => {
  res.send("🚗 Intelligent Toll Management API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});