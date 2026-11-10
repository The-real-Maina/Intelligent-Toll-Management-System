import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });
const getAuth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("itms_token")}` } });

export default function CompanyReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/companies/my", getAuth())
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dashboard"><Sidebar /><div className="content"><p>Loading...</p></div></div>;

  const { vehicles, payments } = data || { vehicles: [], payments: [] };
  const totalSpent = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const spendByVehicle = {};
  payments.forEach(p => {
    const key = p.plate_number || "Unknown";
    spendByVehicle[key] = (spendByVehicle[key] || 0) + parseFloat(p.amount || 0);
  });

  const spendByGate = {};
  payments.forEach(p => {
    const key = p.gate_name || "Unknown";
    spendByGate[key] = (spendByGate[key] || 0) + parseFloat(p.amount || 0);
  });

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "var(--text-heading)", borderBottom: "2px solid #198754", paddingBottom: "10px", marginBottom: "25px" }}>
          📊 Fleet Reports
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "linear-gradient(135deg, #198754, #0d6efd)", padding: "25px", borderRadius: "12px", color: "white", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Total Spent</p>
            <h1 style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: "800" }}>KES {totalSpent.toLocaleString()}</h1>
          </div>
          <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Vehicles in Fleet</p>
            <h1 style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: "800", color: "var(--text-heading)" }}>{vehicles.length}</h1>
          </div>
          <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Total Payments</p>
            <h1 style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: "800", color: "var(--text-heading)" }}>{payments.length}</h1>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <h4 style={{ margin: "0 0 15px", color: "var(--text)" }}>🚗 Spend by Vehicle</h4>
            {Object.keys(spendByVehicle).length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No data yet.</p>
            ) : (
              Object.entries(spendByVehicle).map(([plate, amount]) => (
                <div key={plate} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: "600", color: "var(--text-heading)" }}>{plate}</span>
                  <span style={{ fontWeight: "bold" }}>KES {amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <h4 style={{ margin: "0 0 15px", color: "var(--text)" }}>🛣️ Spend by Toll Gate</h4>
            {Object.keys(spendByGate).length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No data yet.</p>
            ) : (
              Object.entries(spendByGate).map(([gate, amount]) => (
                <div key={gate} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: "600", color: "var(--text-heading)" }}>{gate}</span>
                  <span style={{ fontWeight: "bold" }}>KES {amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}