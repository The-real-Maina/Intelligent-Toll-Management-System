import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import "../App.css";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function AttendantHome() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");
  const [stats, setStats] = useState({ cars: 0, cash: 0, mpesa: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("itms_token");
        const res = await API.get("/payments", { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        // Ensure res.data is an array
        const payments = Array.isArray(res.data) ? res.data : [];
        
        const today = new Date().toLocaleDateString();
        const todayTxns = payments.filter(t => 
          new Date(t.payment_date).toLocaleDateString() === today
        );
        
        setStats({
          cars: todayTxns.length,
          cash: todayTxns.filter(t => t.payment_method === "Cash").reduce((s, t) => s + parseFloat(t.amount), 0),
          mpesa: todayTxns.filter(t => t.payment_method === "Mpesa").reduce((s, t) => s + parseFloat(t.amount), 0),
        });
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "40px" }}>
        <h1 style={{ color: "#198754", marginBottom: "10px" }}>
          Welcome back, {user?.full_name || "Attendant"}! 👋
        </h1>
        <p style={{ color: "#666", marginBottom: "40px" }}>
          Here is your shift overview for today at <strong>Mlolongo Gate (A109)</strong>.
        </p>

        {loading ? (
          <p>Loading stats...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px" }}>
            <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", borderTop: "5px solid #0d6efd", textAlign: "center" }}>
              <h2 style={{ margin: 0, fontSize: "48px", color: "#0d6efd" }}>{stats.cars}</h2>
              <p style={{ margin: "10px 0 0", color: "#666", fontWeight: "bold" }}>Vehicles Passed</p>
            </div>
            <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", borderTop: "5px solid #6f42c1", textAlign: "center" }}>
              <h2 style={{ margin: 0, fontSize: "48px", color: "#6f42c1" }}>KES {stats.mpesa}</h2>
              <p style={{ margin: "10px 0 0", color: "#666", fontWeight: "bold" }}>M-Pesa Collected</p>
            </div>
            <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", borderTop: "5px solid #f0ad4e", textAlign: "center" }}>
              <h2 style={{ margin: 0, fontSize: "48px", color: "#f0ad4e" }}>KES {stats.cash}</h2>
              <p style={{ margin: "10px 0 0", color: "#666", fontWeight: "bold" }}>Cash Collected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}