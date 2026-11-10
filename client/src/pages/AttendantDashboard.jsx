import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import "../App.css";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

function AttendantDashboard() {
  // --- STATE ---
  const [reference, setReference] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [cashForm, setCashForm] = useState({ plate_number: "", amount: "" });
  const [cashMessage, setCashMessage] = useState({ type: "", text: "" });
  const [cashLoading, setCashLoading] = useState(false);

  const [searchPlate, setSearchPlate] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [dailyTxns, setDailyTxns] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(true);

  const ASSIGNED_GATE_ID = 1; 

  // --- FETCH DATA ---
  const fetchDaily = async () => {
    try {
      const token = localStorage.getItem("itms_token");
      const res = await API.get("/payments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const today = new Date().toLocaleDateString();
      const todaysPayments = res.data.filter(p => 
        new Date(p.payment_date).toLocaleDateString() === today
      );
      
      setDailyTxns(todaysPayments);
    } catch (error) {
      console.error("Failed to load daily transactions", error);
    } finally {
      setLoadingTxns(false);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, []);

  // --- HANDLERS ---
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem("itms_token");
      const res = await API.get(`/payments/verify/${reference}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult({ type: "success", data: res.data });
    } catch (err) {
      setResult({ type: "error", message: err.response?.data?.message || "Payment not found" });
    } finally {
      setLoading(false);
    }
  };

  const handleCashSubmit = async (e) => {
    e.preventDefault();
    setCashLoading(true);
    setCashMessage({ type: "", text: "" });
    try {
      const token = localStorage.getItem("itms_token");
      await API.post("/payments/cash", {
        plate_number: cashForm.plate_number.toUpperCase(),
        gate_id: ASSIGNED_GATE_ID,
        amount: Number(cashForm.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCashMessage({ type: "success", text: `Cash payment of KES ${cashForm.amount} recorded!` });
      setCashForm({ plate_number: "", amount: "" });
      fetchDaily(); 
    } catch (err) {
      setCashMessage({ type: "error", text: err.response?.data?.message || "Failed to record cash payment" });
    } finally {
      setCashLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchPlate) return;
    setSearchLoading(true);
    setSearchResults(null);
    try {
      const token = localStorage.getItem("itms_token");
      const res = await API.get(`/payments/search/vehicle/${searchPlate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (error) {
      console.error("Search failed", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const printReceipt = (payment) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>ITMS Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; text-align: center; }
            h1 { font-size: 20px; }
            .box { border: 2px dashed #000; padding: 20px; max-width: 300px; margin: 0 auto; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>ITMS TOLL RECEIPT</h1>
            <p>Nairobi Expressway</p>
            <hr />
            <div class="row"><strong>Ref:</strong> <span>${payment.reference_number}</span></div>
            <div class="row"><strong>Vehicle:</strong> <span>${payment.plate_number}</span></div>
            <div class="row"><strong>Driver:</strong> <span>${payment.owner_name}</span></div>
            <div class="row"><strong>Amount:</strong> <span>KES ${payment.amount}</span></div>
            <div class="row"><strong>Date:</strong> <span>${new Date().toLocaleString()}</span></div>
            <hr />
            <p>Thank you for using ITMS!</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- CALCULATE QUICK STATS ---
  const totalCarsToday = dailyTxns.length;
  const totalCashToday = dailyTxns.filter(t => t.payment_method === "Cash").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalMpesaToday = dailyTxns.filter(t => t.payment_method === "Mpesa").reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="dashboard">
      <Sidebar />
      
      <div className="content" style={{ padding: "30px" }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: "25px", borderBottom: "2px solid #198754", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ color: "#198754", margin: 0 }}>Toll Attendant Terminal</h2>
            <p style={{ color: "#666", margin: "5px 0 0" }}>Assigned to: <strong>Mlolongo Gate (A109)</strong></p>
          </div>
          <div style={{ background: "#e8f8ee", padding: "8px 16px", borderRadius: "8px", border: "1px solid #5cc98a" }}>
            <span style={{ color: "#1a7a44", fontWeight: "bold" }}>🟢 Shift Active</span>
          </div>
        </div>

        {/* QUICK STATS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "25px" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #0d6efd" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#666", fontWeight: "600" }}>🚗 Vehicles Passed Today</p>
            <h2 style={{ margin: "5px 0 0", color: "#0d6efd" }}>{totalCarsToday}</h2>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #6f42c1" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#666", fontWeight: "600" }}>📱 M-Pesa Collected Today</p>
            <h2 style={{ margin: "5px 0 0", color: "#6f42c1" }}>KES {totalMpesaToday.toLocaleString()}</h2>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #f0ad4e" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#666", fontWeight: "600" }}>💵 Cash Collected Today</p>
            <h2 style={{ margin: "5px 0 0", color: "#f0ad4e" }}>KES {totalCashToday.toLocaleString()}</h2>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "25px" }}>
          
          {/* LEFT: M-PESA VERIFY */}
          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <h4 style={{ textAlign: "center", color: "#198754", marginBottom: "15px", fontWeight: "bold" }}>📱 Verify M-Pesa Payment</h4>
            <form onSubmit={handleVerify} style={{ display: "flex", gap: "10px" }}>
              <input 
                type="text" 
                placeholder="Enter Reference (e.g. mpesa-123456)" 
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "15px" }}
                required
              />
              <button type="submit" className="btn btn-success" disabled={loading} style={{ fontWeight: "bold", padding: "0 20px" }}>
                {loading ? "..." : "Verify"}
              </button>
            </form>

            {result && result.type === "success" && (
              <div style={{ marginTop: "15px", background: "#d1fae5", border: "2px solid #10b981", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                <h3 style={{ color: "#065f46", margin: 0 }}>✅ VALID PAYMENT</h3>
                <p style={{ margin: "5px 0", fontWeight: "bold" }}>Vehicle: {result.data.payment.plate_number}</p>
                <p style={{ margin: 0 }}>Amount: KES {result.data.payment.amount}</p>
                <button onClick={() => printReceipt(result.data.payment)} style={{ marginTop: "10px", padding: "6px 12px", background: "#065f46", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                  🖨️ Print Receipt
                </button>
              </div>
            )}

            {result && result.type === "error" && (
              <div style={{ marginTop: "15px", background: "#fee2e2", border: "2px solid #ef4444", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                <h3 style={{ color: "#991b1b", margin: 0 }}>❌ INVALID</h3>
                <p style={{ margin: "5px 0 0", fontWeight: "bold", fontSize: "14px" }}>{result.message}</p>
              </div>
            )}
          </div>

          {/* RIGHT: CASH PAYMENT */}
          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
             <h4 style={{ textAlign: "center", color: "#198754", marginBottom: "15px", fontWeight: "bold" }}>💵 Record Cash Payment</h4>
             {cashMessage.text && (
                <div className={`alert ${cashMessage.type === "success" ? "alert-success" : "alert-danger"}`} style={{ fontSize: "13px", padding: "8px", marginBottom: "10px" }}>
                  {cashMessage.text}
                </div>
              )}
             <form onSubmit={handleCashSubmit} style={{ display: "flex", gap: "10px" }}>
                <input type="text" placeholder="Plate Number (e.g. KDA 123A)" value={cashForm.plate_number} onChange={(e) => setCashForm({ ...cashForm, plate_number: e.target.value })} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} required />
                <input type="number" placeholder="Amount (KES)" value={cashForm.amount} onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })} style={{ width: "120px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} required />
                <button type="submit" className="btn btn-primary" disabled={cashLoading} style={{ fontWeight: "bold" }}>
                  {cashLoading ? "..." : "Record"}
                </button>
             </form>
          </div>
        </div>

        {/* SEARCH BAR ROW */}
        <div style={{ background: "white", padding: "20px 25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", marginBottom: "25px" }}>
           <h4 style={{ color: "#333", margin: "0 0 15px 0", fontWeight: "bold", fontSize: "16px" }}>🔍 Search Vehicle Registration</h4>
           <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}>
              <input 
                type="text" 
                placeholder="Enter plate number to view owner details (e.g. KDA)" 
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "15px" }}
                required
              />
              <button type="submit" className="btn btn-success" disabled={searchLoading} style={{ padding: "0 30px", fontWeight: "bold" }}>
                {searchLoading ? "Searching..." : "Search"}
              </button>
           </form>

           {searchResults && searchResults.length > 0 && (
             <div style={{ marginTop: "15px", background: "#f4f6f9", padding: "15px", borderRadius: "8px", display: "flex", gap: "30px" }}>
                <div><span style={{color: "#666", fontSize: "12px"}}>Owner</span> <br/><strong>{searchResults[0].owner_name}</strong></div>
                <div><span style={{color: "#666", fontSize: "12px"}}>Phone</span> <br/><strong>{searchResults[0].owner_phone}</strong></div>
                <div><span style={{color: "#666", fontSize: "12px"}}>Vehicle Type</span> <br/><strong>{searchResults[0].vehicle_type}</strong></div>
             </div>
           )}
           {searchResults && searchResults.length === 0 && (
             <p style={{ marginTop: "10px", color: "#dc3545", fontSize: "14px", fontWeight: "bold" }}>No vehicle found with that plate number.</p>
           )}
        </div>

        {/* TODAY'S TRANSACTIONS TABLE */}
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h4 style={{ color: "#333", margin: 0, fontWeight: "bold" }}>📊 Today's Transactions Log</h4>
            <span style={{ background: "#198754", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
              {dailyTxns.length} Records
            </span>
          </div>

          {loadingTxns ? (
            <p style={{ textAlign: "center", color: "#888" }}>Loading records...</p>
          ) : dailyTxns.length === 0 ? (
            <div style={{ textAlign: "center", color: "#888", padding: "20px" }}>
              <p style={{ fontSize: "30px", margin: "0 0 10px" }}>📭</p>
              <p>No transactions recorded today.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                    <th style={{ padding: "10px 0", color: "#666", fontSize: "13px" }}>Reference</th>
                    <th style={{ padding: "10px 0", color: "#666", fontSize: "13px" }}>Vehicle</th>
                    <th style={{ padding: "10px 0", color: "#666", fontSize: "13px" }}>Method</th>
                    <th style={{ padding: "10px 0", color: "#666", fontSize: "13px" }}>Amount</th>
                    <th style={{ padding: "10px 0", color: "#666", fontSize: "13px" }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyTxns.map((txn, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "10px 0", fontWeight: "600", color: "#198754", fontSize: "13px" }}>{txn.reference_number}</td>
                      <td style={{ padding: "10px 0", fontSize: "14px" }}>{txn.plate_number || "N/A"}</td>
                      <td style={{ padding: "10px 0", fontSize: "13px" }}>
                        <span style={{ background: txn.payment_method === "Cash" ? "#fef3c7" : "#f3e8ff", color: txn.payment_method === "Cash" ? "#92400e" : "#6b21a8", padding: "4px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                          {txn.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: "10px 0", fontWeight: "bold", fontSize: "14px" }}>KES {txn.amount}</td>
                      <td style={{ padding: "10px 0", color: "#888", fontSize: "13px" }}>
                        {new Date(txn.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AttendantDashboard;