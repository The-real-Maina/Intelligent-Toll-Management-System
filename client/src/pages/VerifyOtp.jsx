import { useState } from "react";
import { useLocation, useNavigate, Link, Navigate } from "react-router-dom";
import axios from "axios";
import tollBg from "../assets/toll-bg.jpg";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Where each role lands after a successful login
const homeForRole = (role) =>
  role === "Toll Attendant" ? "/verify-gate" : "/dashboard";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the email, mode and simulated OTP from the Login / Register page
  // mode "register" = Driver verifying a new account
  // mode "login"    = Toll Attendant finishing a login
  const email = location.state?.email || "";
  const mode = location.state?.mode || "register";
  const simulatedOtp = location.state?.simulatedOtp || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Page opened directly, without coming from Login or Register
  if (!email) {
    return <Navigate to="/login" replace />;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await API.post("/auth/verify-login-otp", { email, otp });
        const { token, user } = res.data;

        if (!token || !user) {
          setError("Unexpected response from the server. Please log in again.");
          return;
        }

        localStorage.setItem("itms_token", token);
        localStorage.setItem("itms_user", JSON.stringify(user));
        navigate(homeForRole(user.role));
      } else {
        await API.post("/auth/verify-otp", { email, otp });
        setSuccess("Account verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 81, 50, 0.75), rgba(25, 135, 84, 0.75)), url(${tollBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="card shadow-lg" style={{ width: "420px", borderRadius: "15px" }}>
        <div className="card-body p-5">
          <h2 className="text-center text-success mb-4">
            {mode === "login" ? "Enter Login Code" : "Verify Your Email"}
          </h2>
          
          <p className="text-center text-muted mb-4">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>

          {/* Simulated OTP Box for School Presentation */}
          {simulatedOtp && (
            <div className="alert alert-info text-center">
              <small>🔑 Simulated OTP: <strong>{simulatedOtp}</strong></small>
            </div>
          )}

          {error && <div className="alert alert-danger py-2" style={{ fontSize: "14px" }}>{error}</div>}
          {success && <div className="alert alert-success py-2" style={{ fontSize: "14px" }}>{success}</div>}

          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <input
                type="text"
                className="form-control text-center"
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ fontSize: "24px", letterSpacing: "5px", fontWeight: "bold" }}
                required
              />
            </div>

            <button className="btn btn-success w-100" type="submit" disabled={loading}>
              {loading
                ? "Verifying..."
                : mode === "login"
                ? "Verify & Login"
                : "Verify Account"}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            <Link to="/login" className="text-success fw-bold text-decoration-none">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;