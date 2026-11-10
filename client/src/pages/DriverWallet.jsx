import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { FaWallet, FaPlusCircle } from "react-icons/fa";

export default function DriverWallet() {
  const [wallet, setWallet] = useState({ balance: 0, history: [] });
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });

  const refresh = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get("/wallet");
        if (!cancelled) setWallet({ balance: 0, history: [], ...res.data });
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await API.post("/wallet/topup", { amount: Number(amount) });
      setMessage({ type: "success", text: `Successfully topped up KES ${amount}!` });
      setAmount("");
      refresh();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Top-up failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "40px" }}>
        <h2 style={{ color: "var(--text-heading)" }}>💳 My Toll Wallet</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginTop: "20px" }}>

          {/* Balance Card */}
          <div style={{ background: "linear-gradient(135deg, #198754, #0d6efd)", padding: "40px", borderRadius: "16px", color: "white", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <FaWallet size={50} style={{ marginBottom: "15px", opacity: 0.8 }} />
            <p style={{ fontSize: "18px", margin: 0, opacity: 0.9 }}>Available Balance</p>
            <h1 style={{ fontSize: "56px", margin: "10px 0", fontWeight: "800" }}>
              KES {parseFloat(wallet.balance || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </h1>
            <p style={{ fontSize: "14px", margin: 0, opacity: 0.8 }}>Use your wallet to pay tolls instantly without M-Pesa prompts.</p>
          </div>

          {/* Top Up Card */}
          <div style={{ background: "var(--bg-card)", padding: "40px", borderRadius: "16px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
            <h3 style={{ marginBottom: "20px", color: "var(--text)" }}>Top Up Wallet</h3>
            {message.text && <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`}>{message.text}</div>}

            <form onSubmit={handleTopUp} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px", color: "var(--text)" }}>Amount (KES)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid var(--border-input)", fontSize: "18px", background: "var(--bg-input)", color: "var(--text)" }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-success" disabled={loading} style={{ padding: "15px", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <FaPlusCircle /> {loading ? "Processing..." : "Top Up via M-Pesa"}
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div style={{ background: "var(--bg-card)", padding: "30px", borderRadius: "16px", boxShadow: "var(--shadow)", marginTop: "30px", border: "1px solid var(--border)" }}>
          <h4 style={{ marginBottom: "20px", color: "var(--text)" }}>Recent Wallet Activity</h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-table)", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>Date</th>
                <th style={{ padding: "12px" }}>Description</th>
                <th style={{ padding: "12px" }}>Type</th>
                <th style={{ padding: "12px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {wallet.history?.length > 0 ? wallet.history.map((txn, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{new Date(txn.created_at).toLocaleString()}</td>
                  <td style={{ padding: "12px", color: "var(--text)" }}>{txn.description}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", background: txn.type === "credit" ? "var(--badge-green-bg)" : "var(--badge-red-bg)", color: txn.type === "credit" ? "var(--badge-green-text)" : "var(--badge-red-text)" }}>
                      {txn.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontWeight: "bold", color: txn.type === "credit" ? "#198754" : "#dc3545" }}>
                    {txn.type === "credit" ? "+" : "-"} KES {parseFloat(txn.amount).toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No wallet transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}