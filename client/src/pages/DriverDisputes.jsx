import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

export default function DriverDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyDisputes = async () => {
      try {
        const res = await API.get("/disputes/my"); 
        setDisputes(res.data);
      } catch (err) {
        console.error("Error loading disputes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyDisputes();
  }, []);

  const getStatusBadge = (status) => {
    const colors = {
      Pending: { bg: "var(--status-pending-bg)", color: "var(--status-pending-text)" },
      Resolved: { bg: "var(--status-completed-bg)", color: "var(--status-completed-text)" },
      Rejected: { bg: "var(--status-error-bg)", color: "var(--status-error-text)" },
    };
    const c = colors[status] || colors.Pending;
    return (
      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", background: c.bg, color: c.color }}>
        {status}
      </span>
    );
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "var(--text-heading)", marginBottom: "20px" }}>📩 My Complaints & Disputes</h2>

        {loading ? (
          <p>Loading...</p>
        ) : disputes.length === 0 ? (
          <div style={{ background: "var(--bg-card)", padding: "40px", borderRadius: "12px", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "40px", margin: 0 }}>📭</p>
            <p>You haven't raised any disputes yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {disputes.map((d) => (
              <div key={d.dispute_id} style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", boxShadow: "var(--shadow)", borderLeft: d.status === "Pending" ? "5px solid #f0ad4e" : d.status === "Resolved" ? "5px solid #198754" : "5px solid #dc3545" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                  <div>
                    <strong style={{ color: "var(--text-heading)", fontSize: "16px" }}>{d.reference_number}</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Submitted: {new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  {getStatusBadge(d.status)}
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)" }}>Your Complaint:</p>
                  <p style={{ margin: "4px 0 0", color: "var(--text)", fontStyle: "italic" }}>"{d.reason}"</p>
                  <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>Amount: <strong>KES {d.amount}</strong></p>
                </div>

                {d.status !== "Pending" && (
                  <div style={{ backgroundColor: "var(--bg-subtle)", padding: "15px", borderRadius: "8px", borderLeft: "3px solid #0d6efd" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#0d6efd" }}>Admin Response:</p>
                    <p style={{ margin: "5px 0 0", color: "var(--text)", fontSize: "14px" }}>
                      {d.admin_notes || "No notes provided by admin."}
                    </p>
                    <p style={{ margin: "5px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                      Resolved on: {d.resolved_at ? new Date(d.resolved_at).toLocaleString() : "N/A"}
                    </p>
                  </div>
                )}

                {d.status === "Pending" && (
                  <div style={{ backgroundColor: "var(--bg-subtle)", padding: "15px", borderRadius: "8px" }}>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>⏳ Your complaint is currently being reviewed by the ITMS Admin.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}