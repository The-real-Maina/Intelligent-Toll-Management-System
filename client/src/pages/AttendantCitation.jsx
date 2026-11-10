import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function AttendantCitation() {
  const [form, setForm] = useState({ plate: "", reason: "", amount: "" });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setForm({ plate: "", reason: "", amount: "" });
    }, 3000);
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "40px" }}>
        <h2 style={{ color: "#dc3545", marginBottom: "30px" }}>🚨 Issue Traffic Citation</h2>
        <div style={{ background: "white", padding: "40px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", maxWidth: "600px", borderTop: "5px solid #dc3545" }}>
          
          {success && <div className="alert alert-warning" style={{ fontWeight: "bold" }}>Citation successfully issued and logged to system!</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>Vehicle Plate Number</label>
              <input type="text" placeholder="e.g. KDA 123A" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }} required />
            </div>
            <div>
              <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>Reason for Citation</label>
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }} required>
                <option value="">-- Select Reason --</option>
                <option value="Over-speeding">Over-speeding</option>
                <option value="Bypassing Toll">Bypassing Toll Gate</option>
                <option value="Expired Insurance">Expired Insurance</option>
                <option value="Wrong Lane">Wrong Lane Usage</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>Penalty Amount (KES)</label>
              <input type="number" placeholder="e.g. 5000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }} required />
            </div>
            <button type="submit" className="btn btn-danger" style={{ padding: "15px", fontWeight: "bold", fontSize: "16px", marginTop: "10px" }}>
              Issue Citation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}