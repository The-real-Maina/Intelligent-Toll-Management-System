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
  const [paymentMethod, setPaymentMethod] = useState("Mpesa");

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");

  const pollRef = useRef(null);

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
        console.error("Error loading toll gates:", error);
        setTollBooths([]);
      });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    const calculateFee = async () => {
      if (!vehicleId) {
        setAmount("Select a vehicle first");
        return;
      }
      if (!boothId) {
        setAmount("Select a toll gate");
        return;
      }

      try {
        const vehicle = vehicles.find(
          (v) => String(v.vehicle_id) === String(vehicleId)
        );
        if (!vehicle) {
          setAmount("Vehicle not found");
          return;
        }

        const res = await axios.get(
          `${API_URL}/rates/${boothId}/${vehicle.vehicle_type}`,
          getAuthHeader()
        );

        if (res.data.amount) {
          setAmount(res.data.amount);
        } else {
          setAmount("No rate configured");
        }
      } catch (error) {
        console.error("Rate calculation error:", error);
        setAmount("No rate found");
      }
    };

    calculateFee();
  }, [boothId, vehicleId, vehicles]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (typeof amount !== "number" && isNaN(parseFloat(amount))) {
      setStatusType("error");
      setStatusMessage("No valid toll rate is configured for this vehicle type.");
      return;
    }

    if (!vehicleId || !boothId || !amount || (paymentMethod === "Mpesa" && !phoneNumber)) {
      setStatusType("error");
      setStatusMessage("Please fill in all fields.");
      return;
    }

    if (paymentMethod === "Wallet") {
      return handleSimulatePayment(e);
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

  const handleSimulatePayment = (e) => {
    e.preventDefault();

    if (!vehicleId || !boothId || !amount || isNaN(parseFloat(amount))) {
      setStatusType("error");
      setStatusMessage("Please fill in all fields and ensure the amount is calculated.");
      return;
    }

    setLoading(true);
    setStatusType("pending");
    setStatusMessage(paymentMethod === "Wallet" ? "Processing wallet payment..." : "Simulating M-Pesa STK Push...");

    setTimeout(async () => {
      try {
        await axios.post(
          `${API_URL}/payments`,
          {
            vehicle_id: vehicleId,
            gate_id: boothId,
            amount: Number(amount),
            payment_method: paymentMethod,
          },
          getAuthHeader()
        );

        setLoading(false);
        setStatusType("completed");
        setStatusMessage(`Payment Successful via ${paymentMethod}!`);
      } catch (error) {
        console.error("Simulation error details:", error.response?.data || error);
        setLoading(false);
        setStatusType("error");
        
        const serverMsg = 
          error.response?.data?.error || 
          error.response?.data?.message || 
          error.message || 
          "Unknown error";
        
        alert("PAYMENT FAILED:\n\n" + serverMsg);
        setStatusMessage(serverMsg);
      }
    }, 2000);
  };

  const statusColors = {
    pending: { bg: "var(--status-pending-bg)", border: "var(--status-pending-border)", text: "var(--status-pending-text)" },
    completed: { bg: "var(--status-completed-bg)", border: "var(--status-completed-border)", text: "var(--status-completed-text)" },
    failed: { bg: "var(--status-error-bg)", border: "var(--status-error-border)", text: "var(--status-error-text)" },
    error: { bg: "var(--status-error-bg)", border: "var(--status-error-border)", text: "var(--status-error-text)" },
  };

  const colors = statusColors[statusType];
  const isAmountValid = amount && !isNaN(parseFloat(amount));

  return (
    <div style={pageWrapperStyle}>
      <Sidebar />

      <main
        style={{
          ...mainContentStyle,
          backgroundImage: `linear-gradient(var(--overlay), var(--overlay)), url(${tollBg})`,
        }}
      >
        <div style={contentContainerStyle}>
          <div style={headerStyle}>
            <h2 style={titleStyle}>Pay Toll</h2>
          </div>

          <div style={paymentCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: "30px" }}>💳</span>
              <div>
                <h3 style={cardTitleStyle}>Toll Payment</h3>
                <p style={cardSubtitleStyle}>Select your vehicle and toll gate to make your payment.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={plainFormStyle}>
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
                  <label style={labelStyle}>Toll Gate</label>
                  <select
                    value={boothId}
                    onChange={(e) => setBoothId(e.target.value)}
                    style={selectStyle}
                    disabled={loading}
                    required
                  >
                    <option value="">Select toll gate</option>
                    {tollBooths.map((gate, index) => (
                      <option key={gate.gate_id || index} value={gate.gate_id}>
                        {gate.gate_name} — {gate.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Amount (KES)</label>
                  <input
                    type="text"
                    placeholder="Auto-calculated"
                    value={isAmountValid ? `KES ${parseFloat(amount).toFixed(2)}` : amount || ""}
                    readOnly
                    style={{
                      ...inputStyle,
                      backgroundColor: isAmountValid ? "var(--bg-subtle)" : "var(--bg-input)",
                      fontWeight: isAmountValid ? "bold" : "normal",
                      color: isAmountValid ? "#198754" : "var(--text-muted)",
                    }}
                    disabled={loading}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={selectStyle}
                    disabled={loading}
                  >
                    <option value="Mpesa">M-Pesa STK Push</option>
                    <option value="Wallet">My Toll Wallet</option>
                  </select>
                </div>

                {paymentMethod === "Mpesa" && (
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>M-Pesa Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={inputStyle}
                      disabled={loading}
                      required={paymentMethod === "Mpesa"}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isAmountValid}
                style={{
                  ...buttonStyle,
                  backgroundColor: loading || !isAmountValid ? "var(--btn-green-disabled)" : "#198754",
                  cursor: loading || !isAmountValid ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Processing..." : paymentMethod === "Wallet" ? "💳 Pay with Wallet" : "📱 Pay with M-Pesa"}
              </button>

              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={loading || !isAmountValid}
                style={{
                  ...buttonStyle,
                  backgroundColor: loading || !isAmountValid ? "var(--btn-blue-disabled)" : "#0d6efd",
                  marginTop: "10px",
                  cursor: loading || !isAmountValid ? "not-allowed" : "pointer",
                }}
              >
                🧪 Simulate Payment (For Testing)
              </button>
            </form>

            {statusMessage && (
              <div
                style={{
                  ...statusStyle,
                  backgroundColor: colors?.bg || "var(--bg-subtle)",
                  border: `1px solid ${colors?.border || "var(--border)"}`,
                  color: colors?.text || "var(--text)",
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
              <p style={infoTextStyle}>Select your vehicle and toll gate. The fee calculates automatically.</p>
            </div>
            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>2</div>
              <p style={infoTextStyle}>Choose to pay via <strong>M-Pesa STK Push</strong> or directly from your <strong>Toll Wallet</strong>.</p>
            </div>
            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>3</div>
              <p style={infoTextStyle}>Use the <strong>Simulate</strong> button during presentations to skip the network delay.</p>
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
const titleStyle = { margin: 0, textAlign: "center", color: "var(--text-heading)", fontSize: "28px" };
const paymentCardStyle = { width: "100%", maxWidth: "720px", margin: "0 auto", background: "var(--bg-card)", padding: "30px", borderRadius: "12px", boxShadow: "var(--shadow-lg)", borderLeft: "5px solid #198754", boxSizing: "border-box" };
const cardHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "28px" };
const cardTitleStyle = { margin: 0, color: "var(--text-heading)", fontSize: "22px" };
const cardSubtitleStyle = { margin: "5px 0 0", color: "var(--text-muted)", fontSize: "14px" };
const plainFormStyle = { display: "block", background: "transparent", boxShadow: "none", padding: 0, margin: 0, borderRadius: 0 };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" };
const formGroupStyle = { display: "flex", flexDirection: "column", gap: "7px" };
const labelStyle = { fontWeight: "600", fontSize: "14px", color: "var(--text)" };
const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: "6px", border: "1px solid var(--border-input)", fontSize: "14px", boxSizing: "border-box", backgroundColor: "var(--bg-input)", color: "var(--text)", outline: "none", minHeight: "44px" };
const selectStyle = { ...inputStyle, cursor: "pointer" };
const buttonStyle = { width: "100%", marginTop: "25px", color: "#fff", border: "none", borderRadius: "6px", padding: "13px", fontWeight: "600", fontSize: "15px" };
const statusStyle = { marginTop: "20px", padding: "14px 16px", borderRadius: "6px", textAlign: "center", fontWeight: "500", fontSize: "14px" };
const infoCardStyle = { width: "100%", maxWidth: "720px", margin: "25px auto 0", padding: "24px 30px", background: "var(--bg-card)", borderRadius: "10px", boxShadow: "var(--shadow)", boxSizing: "border-box" };
const infoTitleStyle = { color: "var(--text-heading)", marginTop: 0, marginBottom: "20px", textAlign: "center", fontSize: "20px" };
const instructionStyle = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" };
const instructionNumberStyle = { width: "28px", height: "28px", minWidth: "28px", borderRadius: "50%", backgroundColor: "#198754", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "700", fontSize: "13px" };
const infoTextStyle = { color: "var(--text-table)", fontSize: "14px", lineHeight: "1.6", margin: 0 };

export default PayNow;