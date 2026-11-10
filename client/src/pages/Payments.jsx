import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import API from "../services/api";
import { FaPrint, FaExclamationTriangle } from "react-icons/fa";

function Payments() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");
  const isDriver = user?.role === "Driver";

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get("/payments");
        if (!cancelled) {
          setPayments(Array.isArray(res.data) ? res.data : []);
          setError("");
        }
      } catch (err) {
        console.error("Error loading payments:", err);
        if (!cancelled) {
          setError("Unable to load payment records.");
          setPayments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const printReceipt = (payment) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>ITMS Receipt - ${payment.reference_number}</title>
          <style>
            body { font-family: monospace; padding: 20px; text-align: center; }
            h1 { font-size: 20px; }
            .box { border: 2px dashed #000; padding: 20px; max-width: 300px; margin: 0 auto; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
            .footer { margin-top: 20px; font-size: 12px; color: #555; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>ITMS TOLL RECEIPT</h1>
            <p>Nairobi Expressway</p>
            <hr />
            <div class="row"><strong>Ref:</strong> <span>${payment.reference_number || "N/A"}</span></div>
            <div class="row"><strong>Vehicle:</strong> <span>${payment.plate_number || "N/A"}</span></div>
            <div class="row"><strong>Driver:</strong> <span>${payment.owner_name || user?.full_name || "N/A"}</span></div>
            <div class="row"><strong>Gate:</strong> <span>${payment.gate_name || "N/A"}</span></div>
            <div class="row"><strong>Amount:</strong> <span>KES ${Number(payment.amount || 0).toFixed(2)}</span></div>
            <div class="row"><strong>Method:</strong> <span>${payment.payment_method || "M-Pesa"}</span></div>
            <div class="row"><strong>Date:</strong> <span>${new Date(payment.payment_date).toLocaleString()}</span></div>
            <hr />
            <p class="footer">Thank you for using ITMS!</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const openDisputeDialog = async (payment) => {
    const reason = prompt(`Dispute payment ${payment.reference_number} (KES ${payment.amount})\n\nDescribe the issue:`);
    if (!reason) return;

    try {
      await API.post("/disputes", { payment_id: payment.payment_id, reason });
      alert("✅ Dispute submitted. Admin will review it.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit dispute.");
    }
  };

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const mpesaPayments = payments.filter((p) => {
    const m = p.payment_method?.toLowerCase();
    return m === "mpesa" || m === "m-pesa";
  }).length;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-KE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <h2>{isDriver ? "My Payments" : "All Payments"}</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "-5px", marginBottom: "25px" }}>
          {isDriver ? "View your completed toll payment history" : "Monitor all payments in the system"}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ ...statCardStyle, borderLeft: "5px solid #198754" }}>
            <p style={statLabelStyle}>Total Payments</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#198754", margin: "8px 0 0" }}>{payments.length}</h3>
          </div>
          <div style={{ ...statCardStyle, borderLeft: "5px solid #0d6efd" }}>
            <p style={statLabelStyle}>Total Amount (KES)</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#0d6efd", margin: "8px 0 0" }}>{totalAmount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</h3>
          </div>
          <div style={{ ...statCardStyle, borderLeft: "5px solid #6f42c1" }}>
            <p style={statLabelStyle}>M-Pesa Payments</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#6f42c1", margin: "8px 0 0" }}>{mpesaPayments}</h3>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "24px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h5 style={{ margin: 0, color: "var(--text)", fontWeight: "700", fontSize: "18px" }}>💳 Payment History ({payments.length})</h5>
            <button onClick={refresh} disabled={loading} style={{ padding: "7px 15px", backgroundColor: "#198754", color: "white", border: "none", borderRadius: "5px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "600" }}>
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {error && <div style={{ background: "var(--status-error-bg)", color: "var(--status-error-text)", border: "1px solid var(--status-error-border)", padding: "12px", borderRadius: "6px", marginBottom: "15px" }}>{error}</div>}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "none" }}>
              <thead>
                <tr style={{ backgroundColor: "#198754", color: "white" }}>
                  <th style={tableHeader}>#</th>
                  <th style={tableHeader}>Reference</th>
                  <th style={tableHeader}>Vehicle</th>
                  <th style={tableHeader}>Owner</th>
                  <th style={tableHeader}>Toll Gate</th>
                  <th style={tableHeader}>Amount (KES)</th>
                  <th style={tableHeader}>Method</th>
                  <th style={tableHeader}>Status</th>
                  <th style={tableHeader}>Date</th>
                  {isDriver && <th style={tableHeader}>Receipt</th>}
                  {isDriver && <th style={tableHeader}>Dispute</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isDriver ? "11" : "9"} style={{ padding: "35px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</td></tr>
                ) : payments.length > 0 ? (
                  payments.map((payment, index) => (
                    <tr key={payment.payment_id || index} style={{ backgroundColor: index % 2 === 0 ? "var(--bg-card)" : "var(--bg-stripe)", borderBottom: "1px solid var(--border)" }}>
                      <td style={tableCell}>{index + 1}</td>
                      <td style={{ ...tableCell, fontWeight: "600", color: "#198754" }}>{payment.reference_number || "N/A"}</td>
                      <td style={tableCell}>{payment.plate_number || "N/A"}</td>
                      <td style={tableCell}>{payment.owner_name || "N/A"}</td>
                      <td style={tableCell}>{payment.gate_name || "N/A"}</td>
                      <td style={{ ...tableCell, fontWeight: "600" }}>KES {Number(payment.amount || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td style={tableCell}>
                        <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "var(--badge-purple-bg)", color: "var(--badge-purple-text)" }}>
                          {payment.payment_method || "M-Pesa"}
                        </span>
                      </td>
                      <td style={tableCell}>
                        <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "var(--badge-green-bg)", color: "var(--badge-green-text)" }}>
                          {payment.status || "Paid"}
                        </span>
                      </td>
                      <td style={{ ...tableCell, fontSize: "13px", color: "var(--text-muted)" }}>{formatDate(payment.payment_date || payment.created_at)}</td>
                      {isDriver && (
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <button onClick={() => printReceipt(payment)} style={{ background: "#198754", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", margin: "0 auto" }}>
                            <FaPrint /> Print
                          </button>
                        </td>
                      )}
                      {isDriver && (
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <button onClick={() => openDisputeDialog(payment)} style={{ background: "#ffc107", color: "#000", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", margin: "0 auto" }}>
                            <FaExclamationTriangle /> Dispute
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={isDriver ? "11" : "9"} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No payment records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const statCardStyle = { background: "var(--bg-card)", borderRadius: "10px", padding: "20px", boxShadow: "var(--shadow)", textAlign: "center" };
const statLabelStyle = { fontSize: "13px", color: "var(--text-muted)", margin: 0 };
const tableHeader = { padding: "12px 14px", textAlign: "left", whiteSpace: "nowrap" };
const tableCell = { padding: "12px 14px", whiteSpace: "nowrap" };

export default Payments;