import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import API from "../services/api";

function Payments() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");
  const isDriver = user?.role === "Driver";

  const [payments, setPayments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tollGates, setTollGates] = useState([]);

  const [formData, setFormData] = useState({
    vehicle_id: "", gate_id: "", reference_number: "", amount: "", payment_method: "Mpesa",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadPayments();
    loadVehicles();
    loadTollGates();
  }, []);

  const loadPayments = async () => {
    try { const res = await API.get("/payments"); setPayments(res.data); }
    catch (error) { console.error(error); }
  };

  const loadVehicles = async () => {
    try { const res = await API.get("/vehicles"); setVehicles(res.data); }
    catch (error) { console.error(error); }
  };

  const loadTollGates = async () => {
    try { const res = await API.get("/tollgates"); setTollGates(res.data); }
    catch (error) { console.error(error); }
  };

  const resetForm = () => {
    setFormData({ vehicle_id: "", gate_id: "", reference_number: "", amount: "", payment_method: "Mpesa" });
    setEditingId(null);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/payments/${editingId}`, { reference_number: formData.reference_number, amount: formData.amount, payment_method: formData.payment_method });
        alert("Payment updated successfully");
      } else {
        if (!formData.vehicle_id || !formData.gate_id) { alert("Please select a vehicle and a toll gate"); return; }
        await API.post("/payments", formData);
        alert("Payment recorded successfully");
      }
      resetForm();
      loadPayments();
    } catch (error) { alert(error.response?.data?.message || "Error saving payment"); }
  };

  const handleEdit = (payment) => {
    setEditingId(payment.payment_id);
    setFormData({ vehicle_id: "", gate_id: "", reference_number: payment.reference_number || "", amount: payment.amount || "", payment_method: payment.payment_method || "Mpesa" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payment?")) return;
    try { await API.delete(`/payments/${id}`); loadPayments(); }
    catch (error) { alert("Delete failed"); }
  };

  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <h2>Payments Management</h2>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #198754" }}>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Total Payments</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#198754", margin: "8px 0 0" }}>{payments.length}</h3>
          </div>
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #0d6efd" }}>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Total Amount (KES)</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#0d6efd", margin: "8px 0 0" }}>{totalAmount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</h3>
          </div>
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #6f42c1" }}>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Mpesa Payments</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#6f42c1", margin: "8px 0 0" }}>{payments.filter(p => p.payment_method === "Mpesa").length}</h3>
          </div>
        </div>

        {/* Driver Only - Record Payment Form */}
        {isDriver && (
          <div style={{ background: "white", borderRadius: "10px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "30px", borderLeft: "5px solid #198754" }}>
            <h5 style={{ marginBottom: "20px", color: "#198754", fontWeight: "700" }}>{editingId ? "✏️ Update Payment" : "➕ Record New Payment"}</h5>
            {editingId && <p style={{ fontSize: "13px", color: "#888", marginTop: "-10px", marginBottom: "16px" }}>Only payment details can be updated here.</p>}
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "end" }}>
              {!editingId && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Vehicle</label>
                    <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} required style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%", background: "white", color: "#333" }}>
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.plate_number} — {v.owner_name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Toll Gate</label>
                    <select name="gate_id" value={formData.gate_id} onChange={handleChange} required style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%", background: "white", color: "#333" }}>
                      <option value="">Select toll gate</option>
                      {tollGates.map((g) => <option key={g.gate_id} value={g.gate_id}>{g.gate_name}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Reference Number</label>
                <input type="text" name="reference_number" placeholder="e.g. REF-001" value={formData.reference_number} onChange={handleChange} style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Amount (KES)</label>
                <input type="number" name="amount" placeholder="e.g. 500" value={formData.amount} onChange={handleChange} required step="0.01" style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Payment Method</label>
                <div style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", width: "100%", background: "#f3e8ff", color: "#6b21a8", fontWeight: "600" }}>
                  📱 M-Pesa
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "transparent" }}>Action</label>
                <button type="submit" style={{ padding: "10px 20px", backgroundColor: editingId ? "#f0ad4e" : "#198754", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", width: "100%" }}>{editingId ? "Update Payment" : "Record Payment"}</button>
              </div>
              {editingId && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "transparent" }}>Cancel</label>
                  <button type="button" onClick={resetForm} style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", width: "100%" }}>Cancel</button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Admin View Notice */}
        {!isDriver && (
          <div style={{ background: "#dbeafe", borderRadius: "8px", padding: "12px 20px", marginBottom: "24px", color: "#1e40af", fontSize: "14px", fontWeight: "600" }}>
            ℹ️ You are viewing payments in read-only mode. Drivers record their own payments.
          </div>
        )}

        {/* Table */}
        <div style={{ background: "white", borderRadius: "10px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h5 style={{ marginBottom: "20px", color: "#333", fontWeight: "700" }}>💳 Payment Records ({payments.length})</h5>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#198754", color: "white" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>#</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Reference</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Vehicle</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Owner</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Amount (KES)</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Method</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Date</th>
                  {isDriver && <th style={{ padding: "12px 16px", textAlign: "left" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? payments.map((payment, index) => (
                  <tr key={payment.payment_id} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 16px" }}>{index + 1}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#198754" }}>{payment.reference_number || "N/A"}</td>
                    <td style={{ padding: "12px 16px" }}>{payment.plate_number || "N/A"}</td>
                    <td style={{ padding: "12px 16px" }}>{payment.owner_name || "N/A"}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>KES {parseFloat(payment.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#f3e8ff", color: "#6b21a8" }}>{payment.payment_method}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#888" }}>{new Date(payment.payment_date).toLocaleDateString()}</td>
                    {isDriver && (
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => handleEdit(payment)} style={{ padding: "6px 14px", backgroundColor: "#0d6efd", color: "white", border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginRight: "8px" }}>Edit</button>
                        <button onClick={() => handleDelete(payment.payment_id)} style={{ padding: "6px 14px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Delete</button>
                      </td>
                    )}
                  </tr>
                )) : <tr><td colSpan={isDriver ? "8" : "7"} style={{ padding: "30px", textAlign: "center", color: "#888" }}>No payments found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payments;