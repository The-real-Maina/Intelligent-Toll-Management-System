import { useEffect, useState, useRef } from "react";
import {
  getVehicles,
  getTollBooths,
  initiateMpesaPayment,
  checkMpesaStatus,
} from "../services/api";

import Sidebar from "../components/Sidebar";
import tollBg from "../assets/toll-bg.jpg";

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
      .then((res) => {
        setVehicles(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error("Error loading vehicles:", error);
        setVehicles([]);
      });

    getTollBooths()
      .then((res) => {
        setTollBooths(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error("Error loading toll booths:", error);
        setTollBooths([]);
      });

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  // ==========================================
  // AUTO LOAD TOLL AMOUNT
  // ==========================================

  useEffect(() => {
    if (!boothId) {
      setAmount("");
      return;
    }

    const selectedBooth = tollBooths.find(
      (booth) => String(booth.booth_id) === String(boothId)
    );

    if (selectedBooth) {
      const tollAmount =
        selectedBooth.toll_rate ??
        selectedBooth.amount ??
        selectedBooth.rate;

      if (tollAmount !== undefined && tollAmount !== null) {
        setAmount(tollAmount);
      }
    }
  }, [boothId, tollBooths]);

  // ==========================================
  // CHECK M-PESA PAYMENT STATUS
  // ==========================================

  const startPolling = (checkoutRequestId) => {
    let attempts = 0;
    const maxAttempts = 20;

    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    pollRef.current = setInterval(async () => {
      attempts += 1;

      try {
        const res = await checkMpesaStatus(checkoutRequestId);

        const { status } = res.data;

        // PAYMENT SUCCESSFUL
        if (status === "completed") {
          clearInterval(pollRef.current);
          pollRef.current = null;

          setLoading(false);
          setStatusType("completed");

          setStatusMessage(
            "Payment received! Your toll has been paid successfully. The transaction has been recorded in your payment history."
          );

          return;
        }

        // PAYMENT FAILED
        if (status === "failed") {
          clearInterval(pollRef.current);
          pollRef.current = null;

          setLoading(false);
          setStatusType("failed");

          setStatusMessage(
            "Payment failed or was cancelled. Please try again."
          );

          return;
        }
      } catch (error) {
        console.error("Payment status check failed:", error);
      }

      // STOP CHECKING AFTER ABOUT 60 SECONDS
      if (attempts >= maxAttempts) {
        clearInterval(pollRef.current);
        pollRef.current = null;

        setLoading(false);
        setStatusType("error");

        setStatusMessage(
          "We didn't receive payment confirmation in time. If you completed the M-Pesa payment, it may still be processing."
        );
      }
    }, 3000);
  };

  // ==========================================
  // SUBMIT M-PESA PAYMENT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vehicleId || !boothId || !amount || !phoneNumber) {
      setStatusType("error");
      setStatusMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setStatusType("pending");

    setStatusMessage(
      "Sending M-Pesa payment request to your phone..."
    );

    try {
      const res = await initiateMpesaPayment({
        vehicle_id: vehicleId,
        booth_id: boothId,
        amount: Number(amount),
        phoneNumber: phoneNumber,
      });

      setStatusMessage(
        "Check your phone and enter your M-Pesa PIN to complete the payment."
      );

      startPolling(res.data.checkoutRequestId);
    } catch (error) {
      console.error("M-Pesa payment error:", error);

      setLoading(false);
      setStatusType("error");

      setStatusMessage(
        error.response?.data?.message ||
          "Failed to start M-Pesa payment. Please try again."
      );
    }
  };

  // ==========================================
  // STATUS COLOURS
  // ==========================================

  const statusColors = {
    pending: {
      bg: "#fff7e6",
      border: "#ffcc66",
      text: "#8a5a00",
    },

    completed: {
      bg: "#e8f8ee",
      border: "#5cc98a",
      text: "#1a7a44",
    },

    failed: {
      bg: "#fdeaea",
      border: "#e88",
      text: "#a12c2c",
    },

    error: {
      bg: "#fdeaea",
      border: "#e88",
      text: "#a12c2c",
    },
  };

  const colors = statusColors[statusType];

  return (
    <div style={pageWrapperStyle}>
      {/* ================= SIDEBAR ================= */}

      <Sidebar />

      {/* ================= MAIN CONTENT ================= */}

      <main
        style={{
          ...mainContentStyle,

          backgroundImage: `linear-gradient(
            rgba(255,255,255,0.86),
            rgba(255,255,255,0.86)
          ), url(${tollBg})`,
        }}
      >
        <div style={contentContainerStyle}>
          {/* ================= PAGE TITLE ================= */}

          <div style={headerStyle}>
            <h2 style={titleStyle}>
              Pay Toll with M-Pesa
            </h2>
          </div>

          {/* ================= PAYMENT CARD ================= */}

          <div style={paymentCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: "30px" }}>
                📱
              </span>

              <div>
                <h3 style={cardTitleStyle}>
                  M-Pesa Toll Payment
                </h3>

                <p style={cardSubtitleStyle}>
                  Select your vehicle and toll booth to make your
                  payment.
                </p>
              </div>
            </div>

            {/* ================= FORM ================= */}

            <form onSubmit={handleSubmit}>
              <div style={formGridStyle}>
                {/* VEHICLE */}

                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    Vehicle
                  </label>

                  <select
                    value={vehicleId}
                    onChange={(e) =>
                      setVehicleId(e.target.value)
                    }
                    style={selectStyle}
                    disabled={loading}
                    required
                  >
                    <option value="">
                      Select your vehicle
                    </option>

                    {vehicles.map((vehicle) => (
                      <option
                        key={vehicle.vehicle_id}
                        value={vehicle.vehicle_id}
                      >
                        {vehicle.plate_number} —{" "}
                        {vehicle.owner_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TOLL BOOTH */}

                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    Toll Booth
                  </label>

                  <select
                    value={boothId}
                    onChange={(e) =>
                      setBoothId(e.target.value)
                    }
                    style={selectStyle}
                    disabled={loading}
                    required
                  >
                    <option value="">
                      Select toll booth
                    </option>

                    {tollBooths.map((booth) => (
                      <option
                        key={booth.booth_id}
                        value={booth.booth_id}
                      >
                        {booth.booth_name} —{" "}
                        {booth.location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AMOUNT */}

                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    Amount (KES)
                  </label>

                  <input
                    type="number"
                    min="1"
                    placeholder="Toll amount"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    style={inputStyle}
                    disabled={loading}
                    required
                  />
                </div>

                {/* PHONE NUMBER */}

                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    M-Pesa Phone Number
                  </label>

                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value)
                    }
                    style={inputStyle}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* ================= PAYMENT BUTTON ================= */}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...buttonStyle,

                  backgroundColor: loading
                    ? "#9ccbb0"
                    : "#198754",

                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "Processing Payment..."
                  : "📱 Pay with M-Pesa"}
              </button>
            </form>

            {/* ================= STATUS MESSAGE ================= */}

            {statusMessage && (
              <div
                style={{
                  ...statusStyle,

                  backgroundColor:
                    colors?.bg || "#f8f9fa",

                  border: `1px solid ${
                    colors?.border || "#ddd"
                  }`,

                  color:
                    colors?.text || "#333",
                }}
              >
                {statusMessage}
              </div>
            )}
          </div>

          {/* ================= INFORMATION CARD ================= */}

          <div style={infoCardStyle}>
            <h4 style={infoTitleStyle}>
              How M-Pesa Payment Works
            </h4>

            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>
                1
              </div>

              <p style={infoTextStyle}>
                Select your registered vehicle and the toll booth
                you want to pay for.
              </p>
            </div>

            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>
                2
              </div>

              <p style={infoTextStyle}>
                Enter the M-Pesa phone number that will make the
                payment.
              </p>
            </div>

            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>
                3
              </div>

              <p style={infoTextStyle}>
                Click Pay with M-Pesa. An STK Push will be sent to
                your phone.
              </p>
            </div>

            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>
                4
              </div>

              <p style={infoTextStyle}>
                Enter your M-Pesa PIN on your phone to authorize
                the transaction.
              </p>
            </div>

            <div style={instructionStyle}>
              <div style={instructionNumberStyle}>
                5
              </div>

              <p style={infoTextStyle}>
                After confirmation, the successful transaction will
                appear automatically under Payments.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =====================================================
   PAGE STYLES
===================================================== */

const pageWrapperStyle = {
  minHeight: "100vh",
  width: "100%",
};

/*
  Sidebar is fixed.
  Reserve 265px so the page cannot go underneath it.
*/
const mainContentStyle = {
  marginLeft: "265px",
  width: "calc(100% - 265px)",
  minHeight: "100vh",

  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",

  padding: "30px 40px",

  boxSizing: "border-box",
};

/* Main container */

const contentContainerStyle = {
  width: "100%",
  maxWidth: "1000px",

  margin: "0 auto",

  boxSizing: "border-box",
};

/* ================= HEADER ================= */

const headerStyle = {
  borderBottom: "2px solid #198754",

  marginBottom: "25px",

  paddingBottom: "10px",
};

const titleStyle = {
  margin: 0,

  textAlign: "center",

  color: "#198754",

  fontSize: "28px",
};

/* ================= PAYMENT CARD ================= */

const paymentCardStyle = {
  width: "100%",

  maxWidth: "720px",

  margin: "0 auto",

  background: "rgba(255,255,255,0.96)",

  padding: "30px",

  borderRadius: "12px",

  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",

  borderLeft: "5px solid #198754",

  boxSizing: "border-box",
};

/* ================= CARD HEADER ================= */

const cardHeaderStyle = {
  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  gap: "12px",

  marginBottom: "28px",
};

const cardTitleStyle = {
  margin: 0,

  color: "#198754",

  fontSize: "22px",
};

const cardSubtitleStyle = {
  margin: "5px 0 0",

  color: "#777",

  fontSize: "14px",
};

/* ================= FORM ================= */

const formGridStyle = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",

  gap: "20px",
};

const formGroupStyle = {
  display: "flex",

  flexDirection: "column",

  gap: "7px",
};

const labelStyle = {
  fontWeight: "600",

  color: "#333",

  fontSize: "14px",
};

const inputStyle = {
  width: "100%",

  padding: "12px 14px",

  borderRadius: "6px",

  border: "1px solid #ccc",

  fontSize: "14px",

  boxSizing: "border-box",

  backgroundColor: "#fff",

  color: "#333",

  outline: "none",

  minHeight: "44px",
};

const selectStyle = {
  ...inputStyle,

  cursor: "pointer",
};

/* ================= PAYMENT BUTTON ================= */

const buttonStyle = {
  width: "100%",

  marginTop: "25px",

  color: "#fff",

  border: "none",

  borderRadius: "6px",

  padding: "13px",

  fontWeight: "600",

  fontSize: "15px",
};

/* ================= STATUS ================= */

const statusStyle = {
  marginTop: "20px",

  padding: "14px 16px",

  borderRadius: "6px",

  textAlign: "center",

  fontWeight: "500",

  fontSize: "14px",
};

/* ================= INFORMATION CARD ================= */

const infoCardStyle = {
  width: "100%",

  maxWidth: "720px",

  margin: "25px auto 0",

  padding: "24px 30px",

  background: "rgba(255,255,255,0.94)",

  borderRadius: "10px",

  boxShadow: "0 3px 10px rgba(0,0,0,0.1)",

  boxSizing: "border-box",
};

const infoTitleStyle = {
  color: "#198754",

  marginTop: 0,

  marginBottom: "20px",

  textAlign: "center",

  fontSize: "20px",
};

const instructionStyle = {
  display: "flex",

  alignItems: "center",

  gap: "12px",

  marginBottom: "10px",
};

const instructionNumberStyle = {
  width: "28px",

  height: "28px",

  minWidth: "28px",

  borderRadius: "50%",

  backgroundColor: "#198754",

  color: "white",

  display: "flex",

  justifyContent: "center",

  alignItems: "center",

  fontWeight: "700",

  fontSize: "13px",
};

const infoTextStyle = {
  color: "#555",

  fontSize: "14px",

  lineHeight: "1.6",

  margin: 0,
};

export default PayNow;