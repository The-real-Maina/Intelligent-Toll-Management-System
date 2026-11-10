import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });
const getAuth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("itms_token")}` } });

export default function CompanyPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/companies/my", getAuth())
      .then(res => setPayments(res.data.payments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  if (loading) return <div className="dashboard"><Sidebar /><div className="content"><p>Loading...</p></div></div>;

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "var(--text-heading)", borderBottom: "2px solid #198754", paddingBottom: "10px", marginBottom: "25px" }}>
          💳 Fleet Payment History
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
          <div style={{ background: "linear-gradient(135deg, #198754, #0d6efd)", padding: "25px", borderRadius: "12px", color: "white", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Total Toll Paid</p>
            <h1 style={{ margin: "8px 0 0", fontSize: "36px", fontWeight: "800" }}>KES {totalSpent.toLocaleString()}</h1>
          </div>
          <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Total Transactions</p>
            <h1 style={{ margin: "8px 0 0", fontSize: "36px", fontWeight: "800", color: "var(--text-heading)" }}>{payments.length}</h1>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)" }}>
          {payments.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>No payments yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "12px" }}>Reference</th>
                  <th style={{ padding: "12px" }}>Vehicle</th>
                  <th style={{ padding: "12px" }}>Gate</th>
                  <th style={{ padding: "12px" }}>Amount</th>
                  <th style={{ padding: "12px" }}>Method</th>
                  <th style={{ padding: "12px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.payment_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontWeight: "600", color: "var(--text-heading)" }}>{p.reference_number || "N/A"}</td>
                    <td style={{ padding: "12px" }}>{p.plate_number || "N/A"}</td>
                    <td style={{ padding: "12px" }}>{p.gate_name || "N/A"}</td>
                    <td style={{ padding: "12px", fontWeight: "bold" }}>KES {parseFloat(p.amount).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}>{p.payment_method}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{new Date(p.payment_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}