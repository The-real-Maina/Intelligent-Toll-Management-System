import { useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function AttendantCash() {
  const [form, setForm] = useState({ plate_number: "", amount: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [blacklistAlert, setBlacklistAlert] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    setBlacklistAlert("");
    try {
      const token = localStorage.getItem("itms_token");
      await API.post("/payments/cash", { plate_number: form.plate_number.toUpperCase(), gate_id: 1, amount: Number(form.amount) }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage({ type: "success", text: `Cash of KES ${form.amount} recorded for ${form.plate_number.toUpperCase()}!` });
      setForm({ plate_number: "", amount: "" });
    } catch (err) {
      if (err.response?.status === 403) {
        setBlacklistAlert(err.response?.data?.message);
      } else {
        setMessage({ type: "error", text: err.response?.data?.message || "Failed to record cash." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "40px" }}>
        <h2 style={{ color: "#198754", marginBottom: "30px" }}>💵 Record Cash Payment</h2>

        {blacklistAlert && (
          <div style={{ marginBottom: "30px", background: "#7f1d1d", border: "4px solid #dc2626", padding: "30px", borderRadius: "12px", textAlign: "center", color: "white", maxWidth: "600px" }}>
            <h1 style={{ fontSize: "60px", margin: 0 }}>🚨</h1>
            <h2 style={{ fontSize: "28px", margin: "10px 0" }}>BLACKLISTED VEHICLE</h2>
            <p style={{ fontSize: "18px", fontWeight: "bold", margin: "10px 0" }}>{blacklistAlert}</p>
            <p style={{ fontSize: "14px" }}>Do NOT allow passage. Call the System Admin immediately.</p>
          </div>
        )}

        <div style={{ background: "white", padding: "40px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", maxWidth: "600px" }}>
          {message.text && <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`}>{message.text}</div>}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>Vehicle Plate Number</label>
              <input type="text" placeholder="e.g. KDA 123A" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }} required />
            </div>
            <div>
              <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>Amount Collected (KES)</label>
              <input type="number" placeholder="e.g. 200" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "15px", fontWeight: "bold", fontSize: "16px", marginTop: "10px" }}>
              {loading ? "Recording..." : "Record Cash Payment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}