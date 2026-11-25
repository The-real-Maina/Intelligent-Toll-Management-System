import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { FaWallet, FaPlusCircle, FaBuilding, FaFlask } from "react-icons/fa";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40; // about 2 minutes

export default function DriverWallet() {
  const [wallet, setWallet] = useState({ balance: 0, company_balance: 0, history: [] });
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Stops the polling loop if the page is closed mid top-up
  const unmounted = useRef(false);
  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const refresh = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get("/wallet");
        if (!cancelled) {
          setWallet({ balance: 0, company_balance: 0, history: [], ...res.data });
        }
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Asks the server whether Safaricom has confirmed the payment yet
  const waitForConfirmation = async (checkoutRequestId) => {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await sleep(POLL_INTERVAL_MS);
      if (unmounted.current) return "cancelled";

      try {
        const res = await API.get(`/wallet/topup/status/${checkoutRequestId}`);
        if (res.data.status === "completed") return "completed";
        if (res.data.status === "failed") return res.data.message || "failed";
      } catch (err) {
        console.error("Status check failed:", err);
      }
    }
    return "timeout";
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const topUpAmount = Number(amount);

    try {
      // 1. Ask the server to send the STK push. No money is added at this point.
      const res = await API.post("/wallet/topup", {
        amount: topUpAmount,
        phoneNumber: phone,
      });

      setMessage({
        type: "info",
        text: `Check your phone and enter your M-Pesa PIN to pay KES ${topUpAmount}. Your wallet updates once the payment is confirmed.`,
      });

      // 2. Wait until M-Pesa confirms (or rejects) the payment
      const result = await waitForConfirmation(res.data.checkoutRequestId);
      if (result === "cancelled") return;

      if (result === "completed") {
        setMessage({ type: "success", text: `KES ${topUpAmount} added to your wallet.` });
        setAmount("");
        refresh();
      } else if (result === "timeout") {
        setMessage({
          type: "error",
          text: "We did not get a confirmation yet. If you paid, your balance will update shortly. Check Recent Wallet Activity below.",
        });
        refresh();
      } else {
        setMessage({ type: "error", text: `Top-up not completed: ${result}` });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Top-up failed" });
    } finally {
      if (!unmounted.current) setLoading(false);
    }
  };

  // Demo only: credits the wallet without sending an STK push
  const handleSimulateTopUp = async () => {
    const topUpAmount = Number(amount);
    if (!topUpAmount || topUpAmount <= 0) {
      setMessage({ type: "error", text: "Enter an amount to simulate." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await API.post("/wallet/topup/simulate", { amount: topUpAmount });
      setMessage({ type: "success", text: `Simulated top-up of KES ${topUpAmount} added to your wallet.` });
      setAmount("");
      refresh();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Simulation failed" });
    } finally {
      if (!unmounted.current) setLoading(false);
    }
  };

  const alertClass =
    message.type === "success" ? "alert-success" : message.type === "info" ? "alert-info" : "alert-danger";

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "40px" }}>
        <h2 style={{ color: "var(--text-heading)" }}>💳 My Toll Wallet</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginTop: "20px" }}>

          {/* Personal Wallet */}
          <div style={{ background: "linear-gradient(135deg, #198754, #0d6efd)", padding: "40px", borderRadius: "16px", color: "white", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <FaWallet size={50} style={{ marginBottom: "15px", opacity: 0.8 }} />
            <p style={{ fontSize: "18px", margin: 0, opacity: 0.9 }}>My Personal Wallet</p>
            <h1 style={{ fontSize: "56px", margin: "10px 0", fontWeight: "800" }}>
              KES {parseFloat(wallet.balance || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </h1>
            <p style={{ fontSize: "14px", margin: 0, opacity: 0.8 }}>Used for your personal vehicles.</p>
          </div>

          {/* Company Wallet */}
          <div style={{ background: "linear-gradient(135deg, #6f42c1, #0d6efd)", padding: "40px", borderRadius: "16px", color: "white", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <FaBuilding size={50} style={{ marginBottom: "15px", opacity: 0.8 }} />
            <p style={{ fontSize: "18px", margin: 0, opacity: 0.9 }}>Company Wallet</p>
            <h1 style={{ fontSize: "56px", margin: "10px 0", fontWeight: "800" }}>
              KES {parseFloat(wallet.company_balance || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </h1>
            <p style={{ fontSize: "14px", margin: 0, opacity: 0.8 }}>Used automatically when paying for fleet vehicles.</p>
          </div>

        </div>

        {/* Top Up Personal Wallet */}
        <div style={{ background: "var(--bg-card)", padding: "30px", borderRadius: "16px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginTop: "30px", maxWidth: "600px" }}>
          <h4 style={{ marginBottom: "15px", color: "var(--text)" }}>➕ Top Up Personal Wallet</h4>
          {message.text && <div className={`alert ${alertClass}`}>{message.text}</div>}
          <form onSubmit={handleTopUp} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
              type="tel"
              placeholder="M-Pesa number, e.g. 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              style={{ padding: "15px", borderRadius: "8px", border: "1px solid var(--border-input)", fontSize: "18px", background: "var(--bg-input)", color: "var(--text)" }}
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Amount, e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              style={{ padding: "15px", borderRadius: "8px", border: "1px solid var(--border-input)", fontSize: "18px", background: "var(--bg-input)", color: "var(--text)" }}
              required
            />
            <button type="submit" className="btn btn-success" disabled={loading} style={{ padding: "15px", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <FaPlusCircle /> {loading ? "Waiting for M-Pesa..." : "Top Up via M-Pesa"}
            </button>

            {/* Simulation button: type="button" so it never submits the form */}
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleSimulateTopUp}
              disabled={loading}
              style={{ padding: "15px", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
            >
              <FaFlask /> Simulate Top Up
            </button>
          </form>
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