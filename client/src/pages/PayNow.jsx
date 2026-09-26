import { useEffect, useState, useRef } from "react";
import { getVehicles, getTollBooths, initiateMpesaPayment, checkMpesaStatus } from "../services/api";

function PayNow() {
  const [vehicles, setVehicles] = useState([]);
  const [tollBooths, setTollBooths] = useState([]);

  const [vehicleId, setVehicleId] = useState("");
  const [boothId, setBoothId] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState(""); // 'pending' | 'completed' | 'failed' | 'error'

  const pollRef = useRef(null);

  useEffect(() => {
    getVehicles()
      .then((res) => setVehicles(res.data))
      .catch(() => setVehicles([]));

    getTollBooths()
      .then((res) => setTollBooths(res.data))
      .catch(() => setTollBooths([]));

    // Clean up any in-flight polling if the user navigates away
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (checkoutRequestId) => {
    let attempts = 0;
    const maxAttempts = 20; // ~60 seconds at 3s intervals

    pollRef.current = setInterval(async () => {
      attempts += 1;

      try {
        const res = await checkMpesaStatus(checkoutRequestId);
        const { status } = res.data;

        if (status === "completed") {
          clearInterval(pollRef.current);
          setLoading(false);
          setStatusType("completed");
          setStatusMessage("Payment received! Your toll has been paid.");
        } else if (status === "failed") {
          clearInterval(pollRef.current);
          setLoading(false);
          setStatusType("failed");
          setStatusMessage("Payment failed or was cancelled. Please try again.");
        }
        // still 'pending' -> keep polling
      } catch (err) {
        // 404 shouldn't normally happen once STK push succeeded, but guard anyway
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollRef.current);
        setLoading(false);
        setStatusType("error");
        setStatusMessage(
          "We didn't get a confirmation in time. Check your phone — if you completed the payment, it may still be processing."
        );
      }
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vehicleId || !boothId || !amount || !phoneNumber) {
      setStatusType("error");
      setStatusMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setStatusType("pending");
    setStatusMessage("Sending payment request to your phone...");

    try {
      const res = await initiateMpesaPayment({
        vehicle_id: vehicleId,
        booth_id: boothId,
        amount: Number(amount),
        phoneNumber,
      });

      setStatusMessage("Check your phone and enter your M-Pesa PIN to complete payment.");
      startPolling(res.data.checkoutRequestId);
    } catch (err) {
      setLoading(false);
      setStatusType("error");
      setStatusMessage(err.response?.data?.message || "Failed to start payment. Please try again.");
    }
  };

  const statusColors = {
    pending: { bg: "#fff7e6", border: "#ffcc66", text: "#8a5a00" },
    completed: { bg: "#e8f8ee", border: "#5cc98a", text: "#1a7a44" },
    failed: { bg: "#fdeaea", border: "#e88", text: "#a12c2c" },
    error: { bg: "#fdeaea", border: "#e88", text: "#a12c2c" },
  };
  const colors = statusColors[statusType] || null;

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, color: "#2d6a4f" }}>
        Pay Toll with M-Pesa
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
        <div>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Vehicle</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            style={selectStyle}
            disabled={loading}
          >
            <option value="">Select your vehicle</option>
            {vehicles.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.plate_number} — {v.owner_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Toll Booth</label>
          <select
            value={boothId}
            onChange={(e) => setBoothId(e.target.value)}
            style={selectStyle}
            disabled={loading}
          >
            <option value="">Select toll booth</option>
            {tollBooths.map((b) => (
              <option key={b.booth_id} value={b.booth_id}>
                {b.booth_name} — {b.location}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Amount (KES)</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 300"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
            disabled={loading}
          />
        </div>

        <div>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>M-Pesa Phone Number</label>
          <input
            type="tel"
            placeholder="e.g. 0712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={inputStyle}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#9ccbb0" : "#2d6a4f",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 0",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 8,
          }}
        >
          {loading ? "Processing..." : "Pay with M-Pesa"}
        </button>
      </form>

      {statusMessage && (
        <div
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 8,
            background: colors?.bg,
            border: `1px solid ${colors?.border}`,
            color: colors?.text,
          }}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 14,
  boxSizing: "border-box",
};

const selectStyle = { ...inputStyle };

export default PayNow;