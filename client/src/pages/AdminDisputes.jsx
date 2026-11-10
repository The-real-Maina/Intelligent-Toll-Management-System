import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const refresh = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get("/disputes/all");
        if (!cancelled) setDisputes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleAction = async (id, action) => {
    setProcessing(true);
    try {
      const res = await API.put(`/disputes/${id}/resolve`, { action, admin_notes: adminNotes });
      alert("✅ " + (res.data.message || "Success!"));
      setSelected(null);
      setAdminNotes("");
      refresh();
    } catch (err) {
      console.error("Resolve error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Unknown error";
      alert("❌ ERROR:\n\n" + msg);
    } finally {
      setProcessing(false);
    }
  };

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
        <h2 style={{ color: "var(--text-heading)", marginBottom: "20px" }}>⚠️ Payment Disputes</h2>

        {loading ? (
          <p>Loading...</p>
        ) : disputes.length === 0 ? (
          <div style={{ background: "var(--bg-card)", padding: "40px", borderRadius: "12px", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "40px", margin: 0 }}>✅</p>
            <p>No disputes. All clear.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

            {/* List */}
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", boxShadow: "var(--shadow)" }}>
              <h4 style={{ marginBottom: "15px", color: "var(--text)" }}>All Disputes</h4>
              {disputes.map((d) => (
                <div
                  key={d.dispute_id}
                  onClick={() => setSelected(d)}
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background: selected?.dispute_id === d.dispute_id ? "var(--bg-subtle)" : "transparent",
                    borderRadius: "8px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--text-heading)" }}>{d.reference_number}</strong>
                    {getStatusBadge(d.status)}
                  </div>
                  <p style={{ margin: "5px 0", fontSize: "13px", color: "var(--text-muted)" }}>
                    {d.full_name} — KES {d.amount}
                  </p>
                </div>
              ))}
            </div>

            {/* Details */}
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "25px", boxShadow: "var(--shadow)" }}>
              {selected ? (
                <>
                  <h4 style={{ marginBottom: "20px", color: "var(--text)" }}>Dispute Details</h4>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>Reference</label>
                    <p style={{ margin: "3px 0", color: "var(--text)" }}>{selected.reference_number}</p>
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>Driver</label>
                    <p style={{ margin: "3px 0", color: "var(--text)" }}>{selected.full_name} ({selected.email})</p>
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>Amount</label>
                    <p style={{ margin: "3px 0", color: "var(--text)", fontWeight: "bold" }}>KES {selected.amount}</p>
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>Reason</label>
                    <p style={{ margin: "3px 0", color: "var(--text)" }}>{selected.reason}</p>
                  </div>

                  {selected.status === "Pending" && (
                    <>
                      <textarea
                        placeholder="Admin notes (optional)"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-input)",
                          minHeight: "80px",
                          background: "var(--bg-input)",
                          color: "var(--text)",
                          marginBottom: "15px"
                        }}
                      />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleAction(selected.dispute_id, "refund")}
                          disabled={processing}
                          className="btn btn-success"
                          style={{ flex: 1, fontWeight: "bold", opacity: processing ? 0.6 : 1 }}
                        >
                          {processing ? "Processing..." : "💰 Refund to Wallet"}
                        </button>
                        <button
                          onClick={() => handleAction(selected.dispute_id, "reject")}
                          disabled={processing}
                          className="btn btn-danger"
                          style={{ flex: 1, fontWeight: "bold", opacity: processing ? 0.6 : 1 }}
                        >
                          {processing ? "Processing..." : "❌ Reject Dispute"}
                        </button>
                      </div>
                    </>
                  )}
                  {selected.status !== "Pending" && (
                    <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px", marginTop: "15px" }}>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                        Resolved at: {selected.resolved_at ? new Date(selected.resolved_at).toLocaleString() : "N/A"}
                      </p>
                      {selected.admin_notes && (
                        <p style={{ margin: "5px 0 0", fontSize: "13px", color: "var(--text)" }}>
                          Notes: {selected.admin_notes}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: "50px" }}>
                  Select a dispute to review.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}