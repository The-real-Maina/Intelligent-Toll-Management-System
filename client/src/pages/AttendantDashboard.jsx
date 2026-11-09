import { useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import "../App.css";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

function AttendantDashboard() {
  const [reference, setReference] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await API.get(`/payments/verify/${reference}`);
      setResult({ type: "success", data: res.data });
    } catch (err) {
      setResult({ 
        type: "error", 
        message: err.response?.data?.message || "Payment not found" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        
        <div style={{ background: "white", padding: "40px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "100%", maxWidth: "500px" }}>
          <h2 style={{ textAlign: "center", color: "#198754", marginBottom: "10px" }}>Gate Verification</h2>
          <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
            Enter the driver's M-Pesa Reference Number to verify their toll payment.
          </p>

          <form onSubmit={handleVerify} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input 
              type="text" 
              placeholder="e.g. mpesa-123456" 
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
              required
            />
            <button type="submit" className="btn btn-success" disabled={loading} style={{ padding: "0 20px" }}>
              {loading ? "Checking..." : "Verify"}
            </button>
          </form>

          {result && result.type === "success" && (
            <div style={{ background: "#d1fae5", border: "2px solid #10b981", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
              <h1 style={{ color: "#065f46", fontSize: "40px", margin: 0 }}>✅ VALID</h1>
              <p style={{ fontSize: "18px", fontWeight: "bold", margin: "10px 0" }}>Vehicle: {result.data.payment.plate_number}</p>
              <p style={{ margin: 0 }}>Amount Paid: KES {result.data.payment.amount}</p>
            </div>
          )}

          {result && result.type === "error" && (
            <div style={{ background: "#fee2e2", border: "2px solid #ef4444", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
              <h1 style={{ color: "#991b1b", fontSize: "40px", margin: 0 }}>❌ INVALID</h1>
              <p style={{ margin: "10px 0", fontWeight: "bold" }}>No payment found for this reference.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AttendantDashboard;