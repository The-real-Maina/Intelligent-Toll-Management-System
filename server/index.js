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

// AI ROUTE IMPORT
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// ---------- CORS ----------
// CLIENT_URL can hold one or more comma-separated origins, e.g.
// https://itms.vercel.app,http://localhost:5173
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, M-Pesa callbacks) with no origin
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

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

// AI ROUTE MOUNT
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("🚗 Intelligent Toll Management API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});