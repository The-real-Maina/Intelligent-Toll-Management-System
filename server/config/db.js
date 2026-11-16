const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // Hosted MySQL (Aiven etc.) requires SSL. Set DB_SSL=true there; leave unset locally.
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

async function testConnection() {
  try {
    const conn = await db.getConnection();
    console.log("✅ Database connected successfully");
    conn.release();
  } catch (err) {
    console.log("❌ Database connection failed:", err.message);
  }
}

testConnection();

module.exports = db;