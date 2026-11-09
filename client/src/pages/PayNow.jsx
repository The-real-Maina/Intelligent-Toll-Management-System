import { useEffect, useState, useRef } from "react";
import {
  getVehicles,
  getTollBooths,
  initiateMpesaPayment,
  checkMpesaStatus,
} from "../services/api";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import tollBg from "../assets/toll-bg.jpg";

// Helper to get the token
const getAuthHeader = () => {
  const token = localStorage.getItem("itms_token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

const API_URL = "http://localhost:5000/api";

function PayNow() {
  const [vehicles, setVehicles] = useState([]);
  const [tollBooths, setTollBooths] = useState([]);

  const [vehicleId, setVehicleId] = useState("");
  const [boothId, setBoothId] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");

  const pollRef = useRef(null);

  // ==========================================
  // LOAD VEHICLES AND TOLL BOOTHS
  // ==========================================
  useEffect(() => {
    getVehicles()
      .then((res) => setVehicles(Array.isArray(res.data) ? res.data : []))
      .catch((error) => {
        console.error("Error loading vehicles:", error);
        setVehicles([]);
      });

    getTollBooths()
      .then((res) => setTollBooths(Array.isArray(res.data) ? res.data : []))
      .catch((error) => {
        console.error("Error loading toll booths:", error);
        setTollBooths([]);
      });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ==========================================
  // SMART TOLL AMOUNT CALCULATION
  // ==========================================
  useEffect(() => {
    const calculateFee = async () => {
      if (!boothId || !vehicleId) {
        setAmount("");
        return;
      }

      try {
        const vehicle = vehicles.find(
          (v) => String(v.vehicle_id) === String(vehicleId)
        );
        if (!vehicle) return;

        const res = await axios.get(
          `${API_URL}/rates/${boothId}/${vehicle.vehicle_type}`,
          getAuthHeader()
        );
        setAmount(res.data.amount);
      } catch (error) {
        console.error("Rate calculation error:", error);
        setAmount("N/A");
      }
    };

    calculateFee();
  }, [boothId, vehicleId, vehicles]);

  // ==========================================
  // CHECK M-PESA PAYMENT STATUS
  // ==========================================
  const startPolling = (checkoutRequestId) => {
    let attempts = 0;
    const maxAttempts = 20;

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      attempts += 1;

      try {
        const res = await checkMpesaStatus(checkoutRequestId);
        const { status } = res.data;

        if (status === "completed") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setLoading(false);
          setStatusType("completed");
          setStatusMessage("Payment received! Your toll has been paid successfully.");
          return;
        }

        if (status === "failed") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setLoading(false);
          setStatusType("failed");
          setStatusMessage("Payment failed or was cancelled. Please try again.");
          return;
        }
      } catch (error) {
        console.error("Payment status check failed:", error);
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setLoading(false);
        setStatusType("error");
        setStatusMessage("We didn't receive payment confirmation in time.");
      }
    }, 3000);
  };

  // ==========================================
  // REAL M-PESA SUBMIT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (amount === "N/A") {
      setStatusType("error");
      setStatusMessage("No toll rate is configured for this vehicle type.");
      return;
    }

    if (!vehicleId || !boothId || !amount || !phoneNumber) {
      setStatusType("error");
      setStatusMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setStatusType("pending");
    setStatusMessage("Sending M-Pesa payment request to your phone...");

    try {
      const res = await initiateMpesaPayment({
        vehicle_id: vehicleId,
        booth_id: boothId,
        amount: Number(amount),
        phoneNumber: phoneNumber,
      });

      setStatusMessage("Check your phone and enter your M-Pesa PIN.");
      startPolling(res.data.checkoutRequestId);
    } catch (error) {
      console.error("M-Pesa payment error:", error);
      setLoading(false);
      setStatusType("error");
      setStatusMessage(error.response?.data?.message || "Failed to start M-Pesa payment.");
    }
  };

  // ==========================================
  // SIMULATE PAYMENT
  // ==========================================
  const handleSimulatePayment = (e) => {
    e.preventDefault();

    if (!vehicleId || !boothId || !amount || amount === "N/A") {
      setStatusType("error");
      setStatusMessage("Please fill in all fields and ensure the amount is calculated.");
      return;
    }

    setLoading(true);
    setStatusType("pending");
    setStatusMessage("Simulating M-Pesa STK Push...");

    setTimeout(async () => {
      try {
        await axios.post(
          `${API_URL}/payments`,
          {
            vehicle_id: vehicleId,
            gate_id: boothId, 
            amount: Number(amount),
            payment_method: "Mpesa", // <-- FIXED: Now matches database ENUM
          },
          getAuthHeader()
        );

        setLoading(false);
        setStatusType("completed");
        setStatusMessage("Simulation Successful! Payment has been saved to the database.");
      } catch (error) {
        console.error("Simulation error details:", error.response?.data || error);
        setLoading(false);
        setStatusType("error");
        setStatusMessage(error.response?.data?.message || "Simulation failed to save. Check backend logs.");
      }
    }, 2000);
  };

  const statusColors = {
    pending: { bg: "#fff7e6", border: "#ffcc66", text: "#8a5a00" },
    completed: { bg: "#e8f8ee", border: "#5cc98a", text: "#1a7a44" },
    failed: { bg: "#fdeaea", border: "#e88", text: "#a12c2c" },
    error: { bg: "#fdeaea", border: "#e88", text: "#a12c2c" },
  };

  const colors = statusColors[statusType];

  return (
    <div style={pageWrapperStyle}>
      <Sidebar />

      <main
        style={{
          ...mainContentStyle,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.86), rgba(255,255,255,0.86)), url(${tollBg})`,
        }}
      >
        <div style={contentContainerStyle}>
          <div style={headerStyle}>
            <h2 style={titleStyle}>Pay Toll with M-Pesa</h2>
          </div>

          <div style={paymentCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: "30px" }}>📱</span>
              <div>
                <h3 style={cardTitleStyle}>M-Pesa Toll Payment</h3>
                <p style={cardSubtitleStyle}>Select your vehicle and toll booth to make your payment.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={formGridStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Vehicle</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    style={selectStyle}
                    disabled={loading}
                    required
                  >
                    <option value="">Select your vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                        {vehicle.plate_number} — {vehicle.owner_name} ({vehicle.vehicle_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Toll Booth</label>
                  <select
                    value={boothId}
                    onChange={(e) => setBoothId(e.target.value)}
                    style={selectStyle}
                    disabled={loading}
                    required
                  >
                    <option value="">Select toll booth</option>
                    {tollBooths.map((booth) => (
                      <option key={booth.booth_id} value={booth.booth_id}>
                        {booth.booth_name} — {booth.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Amount (KES)</label>
                  <input
                    type="text"
                    placeholder="Auto-calculated"
                    value={amount ? `KES ${parseFloat(amount).toFixed(2)}` : ""}
                    readOnly
                    style={{ ...inputStyle, backgroundColor: "#f4f6f9", fontWeight: "bold", color: "#198754" }}
                    disabled={loading}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={inputStyle}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !amount || amount === "N/A"}
                style={{
                  ...buttonStyle,
                  backgroundColor: loading || !amount || amount === "N/A" ? "#9ccbb0" : "#198754",
                  cursor: loading || !amount || amount === "N/A" ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Processing..." : "📱 Pay with M-Pesa"}
              </button>

              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={loading || !amount || amount === "N/A"}
                style={{
                  ...buttonStyle,
                  backgroundColor: loading || !amount || amount === "N/A" ? "#a5c9f0" : "#0d6efd",
                  marginTop: "10px",
                  cursor: loading || !amount || amount === "N/A" ? "not-allowed" : "pointer",
                }}
              >
                🧪 Simulate Payment (For Testing)
              </button>
            </form>

            {statusMessage && (
              <div
                style={{
                  ...statusStyle,
                  backgroundColor: colors?.bg || "#f8f9fa",
                  border: `1px solid ${colors?.border || "#ddd"}`,
                  color: colors?.text || "#333",
                }}
              >
                {statusMessage}
              </div>
            )}
          </div>

          <div style={infoCardStyle}>
            <h4 style={infoTitleStyle}>How Payment Works</h4>
            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>1</div>
              <p style={infoTextStyle}>Select your vehicle and toll booth. The fee calculates automatically.</p>
            </div>
            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>2</div>
              <p style={infoTextStyle}>Use the <strong>Green Button</strong> for real M-Pesa STK Push prompts.</p>
            </div>
            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>3</div>
              <p style={infoTextStyle}>Use the <strong>Blue Button</strong> to simulate a successful payment during presentations.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const pageWrapperStyle = { minHeight: "100vh", width: "100%" };
const mainContentStyle = { marginLeft: "265px", width: "calc(100% - 265px)", minHeight: "100vh", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", padding: "30px 40px", boxSizing: "border-box" };
const contentContainerStyle = { width: "100%", maxWidth: "1000px", margin: "0 auto", boxSizing: "border-box" };
const headerStyle = { borderBottom: "2px solid #198754", marginBottom: "25px", paddingBottom: "10px" };
const titleStyle = { margin: 0, textAlign: "center", color: "#198754", fontSize: "28px" };
const paymentCardStyle = { width: "100%", maxWidth: "720px", margin: "0 auto", background: "rgba(255,255,255,0.96)", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", borderLeft: "5px solid #198754", boxSizing: "border-box" };
const cardHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "28px" };
const cardTitleStyle = { margin: 0, color: "#198754", fontSize: "22px" };
const cardSubtitleStyle = { margin: "5px 0 0", color: "#777", fontSize: "14px" };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" };
const formGroupStyle = { display: "flex", flexDirection: "column", gap: "7px" };
const labelStyle = { fontWeight: "600", color: "#333", fontSize: "14px" };
const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box", backgroundColor: "#fff", color: "#333", outline: "none", minHeight: "44px" };
const selectStyle = { ...inputStyle, cursor: "pointer" };
const buttonStyle = { width: "100%", marginTop: "25px", color: "#fff", border: "none", borderRadius: "6px", padding: "13px", fontWeight: "600", fontSize: "15px" };
const statusStyle = { marginTop: "20px", padding: "14px 16px", borderRadius: "6px", textAlign: "center", fontWeight: "500", fontSize: "14px" };
const infoCardStyle = { width: "100%", maxWidth: "720px", margin: "25px auto 0", padding: "24px 30px", background: "rgba(255,255,255,0.94)", borderRadius: "10px", boxShadow: "0 3px 10px rgba(0,0,0,0.1)", boxSizing: "border-box" };
const infoTitleStyle = { color: "#198754", marginTop: 0, marginBottom: "20px", textAlign: "center", fontSize: "20px" };
const instructionStyle = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" };
const instructionNumberStyle = { width: "28px", height: "28px", minWidth: "28px", borderRadius: "50%", backgroundColor: "#198754", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "700", fontSize: "13px" };
const infoTextStyle = { color: "#555", fontSize: "14px", lineHeight: "1.6", margin: 0 };

export default PayNow;