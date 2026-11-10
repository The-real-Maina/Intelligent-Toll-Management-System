import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const res = await API.get("/companies");
        if (!ignore) setCompanies(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [refreshKey]);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/companies/${id}/status`, { status });
      setRefreshKey((k) => k + 1); // triggers a refetch
    } catch (err) {
      alert(err.response?.data?.message || "Error updating status.");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: { bg: "var(--status-pending-bg)", color: "var(--status-pending-text)" },
      Approved: { bg: "var(--status-completed-bg)", color: "var(--status-completed-text)" },
      Rejected: { bg: "var(--status-error-bg)", color: "var(--status-error-text)" },
    };
    const c = colors[status] || colors.Pending;
    return <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", background: c.bg, color: c.color }}>{status}</span>;
  };

  if (loading) return <div className="dashboard"><Sidebar /><div className="content"><p>Loading...</p></div></div>;

  const pending = companies.filter((c) => c.status === "Pending");

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "var(--text-heading)", borderBottom: "2px solid #198754", paddingBottom: "10px", marginBottom: "25px" }}>
          🏢 Companies ({companies.length})
        </h2>

        {pending.length > 0 && (
          <div style={{ background: "var(--status-pending-bg)", border: "1px solid var(--status-pending-border)", padding: "15px 20px", borderRadius: "8px", marginBottom: "20px" }}>
            <strong style={{ color: "var(--status-pending-text)" }}>⚠️ {pending.length} company registration(s) awaiting your approval.</strong>
          </div>
        )}

        <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)" }}>
          {companies.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>No companies registered yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "12px" }}>Company</th>
                  <th style={{ padding: "12px" }}>Reg. No</th>
                  <th style={{ padding: "12px" }}>Admin</th>
                  <th style={{ padding: "12px" }}>Wallet</th>
                  <th style={{ padding: "12px" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.company_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontWeight: "bold", color: "var(--text-heading)" }}>{c.name}</td>
                    <td style={{ padding: "12px" }}>{c.registration_number}</td>
                    <td style={{ padding: "12px" }}>{c.admin_name || "—"}<br /><small style={{ color: "var(--text-muted)" }}>{c.admin_email}</small></td>
                    <td style={{ padding: "12px", fontWeight: "bold" }}>KES {parseFloat(c.wallet_balance || 0).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}>{getStatusBadge(c.status)}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      {c.status === "Pending" && (
                        <>
                          <button onClick={() => updateStatus(c.company_id, "Approved")} className="btn btn-success btn-sm me-2" style={{ fontWeight: "bold" }}>
                            <FaCheckCircle /> Approve
                          </button>
                          <button onClick={() => updateStatus(c.company_id, "Rejected")} className="btn btn-danger btn-sm" style={{ fontWeight: "bold" }}>
                            <FaTimesCircle /> Reject
                          </button>
                        </>
                      )}
                      {c.status !== "Pending" && (
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          {c.status === "Approved" ? "Approved" : "Rejected"}
                        </span>
                      )}
                    </td>
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