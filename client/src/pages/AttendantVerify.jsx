import { useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function AttendantVerify() {
  const [reference, setReference] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem("itms_token");
      const res = await API.get(`/payments/verify/${reference}`, { headers: { Authorization: `Bearer ${token}` } });
      setResult({ type: "success", data: res.data });
    } catch (err) {
      if (err.response?.status === 403) {
        setResult({ type: "blacklisted", message: err.response?.data?.message });
      } else {
        setResult({ type: "error", message: err.response?.data?.message || "Payment not found" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "40px" }}>
        <h2 style={{ color: "#198754", marginBottom: "30px" }}>📱 Verify M-Pesa Payment</h2>
        <div style={{ background: "white", padding: "40px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", maxWidth: "700px" }}>
          <form onSubmit={handleVerify} style={{ display: "flex", gap: "10px" }}>
            <input type="text" placeholder="Enter Reference (e.g. mpesa-123456)" value={reference} onChange={(e) => setReference(e.target.value)} style={{ flex: 1, padding: "15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "18px", textAlign: "center" }} required />
            <button type="submit" className="btn btn-success" disabled={loading} style={{ padding: "0 30px", fontWeight: "bold", fontSize: "16px" }}>
              {loading ? "..." : "Verify"}
            </button>
          </form>

          {result && result.type === "success" && (
            <div style={{ marginTop: "30px", background: "#d1fae5", border: "2px solid #10b981", padding: "30px", borderRadius: "12px", textAlign: "center" }}>
              <h1 style={{ color: "#065f46", fontSize: "50px", margin: 0 }}>✅ VALID</h1>
              <p style={{ fontSize: "22px", fontWeight: "bold", margin: "15px 0" }}>{result.data.payment.plate_number}</p>
              <p style={{ fontSize: "18px", margin: 0 }}>Amount: <strong>KES {result.data.payment.amount}</strong></p>
            </div>
          )}

          {result && result.type === "blacklisted" && (
            <div style={{ marginTop: "30px", background: "#7f1d1d", border: "4px solid #dc2626", padding: "40px", borderRadius: "12px", textAlign: "center", color: "white" }}>
              <h1 style={{ fontSize: "80px", margin: 0 }}>🚨</h1>
              <h2 style={{ fontSize: "36px", margin: "10px 0" }}>BLACKLISTED VEHICLE</h2>
              <p style={{ fontSize: "20px", fontWeight: "bold", margin: "10px 0" }}>{result.message}</p>
              <p style={{ fontSize: "16px" }}>Do NOT allow passage. Call the System Admin immediately.</p>
            </div>
          )}

          {result && result.type === "error" && (
            <div style={{ marginTop: "30px", background: "#fee2e2", border: "2px solid #ef4444", padding: "30px", borderRadius: "12px", textAlign: "center" }}>
              <h1 style={{ color: "#991b1b", fontSize: "50px", margin: 0 }}>❌ INVALID</h1>
              <p style={{ margin: "15px 0 0", fontWeight: "bold", fontSize: "18px" }}>{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}