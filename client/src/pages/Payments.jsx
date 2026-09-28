import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import API from "../services/api";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/payments");

      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading payments:", error);

      setError("Unable to load payment records.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Total amount paid
  const totalAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  // Total M-Pesa payments
  const mpesaPayments = payments.filter((payment) => {
    const method = payment.payment_method?.toLowerCase();

    return method === "mpesa" || method === "m-pesa";
  }).length;

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-KE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">

        {/* Page Title */}
        <h2>Payments Management</h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginTop: "-5px",
            marginBottom: "25px",
          }}
        >
          View your completed toll payment history
        </p>

        {/* ================= SUMMARY CARDS ================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >

          {/* Total Payments */}
          <div
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderLeft: "5px solid #198754",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "#888",
                margin: 0,
              }}
            >
              Total Payments
            </p>

            <h3
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#198754",
                margin: "8px 0 0",
              }}
            >
              {payments.length}
            </h3>
          </div>

          {/* Total Amount */}
          <div
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderLeft: "5px solid #0d6efd",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "#888",
                margin: 0,
              }}
            >
              Total Amount (KES)
            </p>

            <h3
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#0d6efd",
                margin: "8px 0 0",
              }}
            >
              {totalAmount.toLocaleString("en-KE", {
                minimumFractionDigits: 2,
              })}
            </h3>
          </div>

          {/* M-Pesa */}
          <div
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderLeft: "5px solid #6f42c1",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "#888",
                margin: 0,
              }}
            >
              M-Pesa Payments
            </p>

            <h3
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#6f42c1",
                margin: "8px 0 0",
              }}
            >
              {mpesaPayments}
            </h3>
          </div>

        </div>

        {/* ================= PAYMENT RECORDS ================= */}

        <div
          style={{
            background: "white",
            borderRadius: "10px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h5
              style={{
                margin: 0,
                color: "#333",
                fontWeight: "700",
                fontSize: "18px",
              }}
            >
              💳 Payment History ({payments.length})
            </h5>

            <button
              onClick={loadPayments}
              disabled={loading}
              style={{
                padding: "7px 15px",
                backgroundColor: "#198754",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
              }}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {error && (
            <div
              style={{
                background: "#fdeaea",
                color: "#a12c2c",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "15px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >

              <thead>
                <tr
                  style={{
                    backgroundColor: "#198754",
                    color: "white",
                  }}
                >
                  <th style={tableHeader}>#</th>

                  <th style={tableHeader}>
                    Reference
                  </th>

                  <th style={tableHeader}>
                    Vehicle
                  </th>

                  <th style={tableHeader}>
                    Owner
                  </th>

                  <th style={tableHeader}>
                    Toll Gate
                  </th>

                  <th style={tableHeader}>
                    Amount (KES)
                  </th>

                  <th style={tableHeader}>
                    Method
                  </th>

                  <th style={tableHeader}>
                    Status
                  </th>

                  <th style={tableHeader}>
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        padding: "35px",
                        textAlign: "center",
                        color: "#888",
                      }}
                    >
                      Loading payment records...
                    </td>
                  </tr>
                ) : payments.length > 0 ? (
                  payments.map((payment, index) => (

                    <tr
                      key={payment.payment_id || index}
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? "#fff"
                            : "#f9f9f9",

                        borderBottom:
                          "1px solid #eee",
                      }}
                    >

                      <td style={tableCell}>
                        {index + 1}
                      </td>

                      {/* Reference */}
                      <td
                        style={{
                          ...tableCell,
                          fontWeight: "600",
                          color: "#198754",
                        }}
                      >
                        {payment.reference_number ||
                          payment.mpesa_receipt_number ||
                          payment.transaction_id ||
                          "N/A"}
                      </td>

                      {/* Vehicle */}
                      <td style={tableCell}>
                        {payment.plate_number || "N/A"}
                      </td>

                      {/* Owner */}
                      <td style={tableCell}>
                        {payment.owner_name || "N/A"}
                      </td>

                      {/* Toll Gate */}
                      <td style={tableCell}>
                        {payment.gate_name ||
                          payment.booth_name ||
                          "N/A"}
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          ...tableCell,
                          fontWeight: "600",
                        }}
                      >
                        KES{" "}
                        {Number(
                          payment.amount || 0
                        ).toLocaleString("en-KE", {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      {/* Method */}
                      <td style={tableCell}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#f3e8ff",
                            color: "#6b21a8",
                          }}
                        >
                          {payment.payment_method ||
                            "M-Pesa"}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={tableCell}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#e8f8ee",
                            color: "#198754",
                          }}
                        >
                          {payment.status || "Paid"}
                        </span>
                      </td>

                      {/* Date */}
                      <td
                        style={{
                          ...tableCell,
                          fontSize: "13px",
                          color: "#777",
                        }}
                      >
                        {formatDate(
                          payment.payment_date ||
                            payment.created_at
                        )}
                      </td>

                    </tr>
                  ))
                ) : (

                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#888",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "30px",
                          marginBottom: "8px",
                        }}
                      >
                        💳
                      </div>

                      No payment records found.

                      <div
                        style={{
                          fontSize: "13px",
                          marginTop: "5px",
                        }}
                      >
                        Payments made through Pay Toll
                        will appear here.
                      </div>
                    </td>
                  </tr>

                )}

              </tbody>

            </table>
          </div>

        </div>

      </div>
    </div>
  );
}

const tableHeader = {
  padding: "12px 14px",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tableCell = {
  padding: "12px 14px",
  whiteSpace: "nowrap",
};

export default Payments;