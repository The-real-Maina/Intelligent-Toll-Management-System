import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

const cardStyle = {
  background: "var(--bg-card)",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
};

export default function AttendantShift() {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState("");

  const refresh = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get("/attendance/my-shift");
        if (!cancelled) setShift(res.data);
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

  const handleClockIn = async () => {
    try {
      const res = await API.post("/attendance/clock-in", {});
      setMessage(res.data.message);
      refresh();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error clocking in");
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await API.post("/attendance/clock-out", {});
      setMessage(res.data.message);
      refresh();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error clocking out");
    }
  };

  if (loading) return <div className="dashboard"><Sidebar /><div className="content"><p>Loading...</p></div></div>;

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "40px" }}>
        <h2 style={{ color: "#198754" }}>🕒 My Shift</h2>

        {message && <div className="alert alert-info">{message}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>

          {/* Clock In / Out Card */}
          <div style={{ ...cardStyle, textAlign: "center" }}>
            <h3 style={{ color: "var(--text)" }}>Assigned Shift: <span style={{ color: "#198754" }}>{shift?.shift_type || "Day"}</span></h3>

            {shift?.is_active ? (
              <>
                <p style={{ fontSize: "18px", color: "#198754", fontWeight: "bold" }}>🟢 Currently On Duty</p>
                <p style={{ color: "var(--text-muted)" }}>Started at: {new Date(shift.current_shift.clock_in).toLocaleTimeString()}</p>
                <button onClick={handleClockOut} className="btn btn-danger" style={{ padding: "12px 30px", fontWeight: "bold", fontSize: "16px", marginTop: "20px" }}>
                  🚪 Clock Out
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: "18px", color: "#dc3545", fontWeight: "bold" }}>🔴 Not Clocked In</p>
                <button onClick={handleClockIn} className="btn btn-success" style={{ padding: "12px 30px", fontWeight: "bold", fontSize: "16px", marginTop: "20px" }}>
                  ✅ Clock In
                </button>
              </>
            )}
          </div>

          {/* Shift History Card */}
          <div style={cardStyle}>
            <h3 style={{ color: "var(--text)", marginBottom: "20px" }}>Recent Shifts</h3>
            {shift?.history?.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
                <p style={{ margin: 0, fontWeight: "bold", color: "var(--text)" }}>{new Date(h.clock_in).toLocaleDateString()}</p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                  In: {new Date(h.clock_in).toLocaleTimeString()}
                  {h.clock_out && ` — Out: ${new Date(h.clock_out).toLocaleTimeString()}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}