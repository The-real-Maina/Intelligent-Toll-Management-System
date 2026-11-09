import { useState } from "react";
import { FaUser, FaLock, FaArrowLeft } from "react-icons/fa"; // Added FaArrowLeft
import { useNavigate } from "react-router-dom";
import axios from "axios";
import tollBg from "../assets/toll-bg.jpg";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Where each role lands after a successful login
const homeForRole = (role) =>
  role === "Toll Attendant" ? "/verify-gate" : "/dashboard";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", formData);
      const data = res.data;

      // Toll Attendant: password was correct, OTP is still needed
      if (data.otp_required) {
        navigate("/verify-otp", {
          state: {
            email: data.email,
            mode: "login",
            simulatedOtp: data.simulated_otp,
          },
        });
        return;
      }

      // Admin / verified Driver: logged in
      if (data.token && data.user) {
        localStorage.setItem("itms_token", data.token);
        localStorage.setItem("itms_user", JSON.stringify(data.user));
        navigate(homeForRole(data.user.role));
        return;
      }

      setError("Unexpected response from the server. Please try again.");
    } catch (err) {
      console.error(err);

      // Driver who never finished registration: a fresh OTP was sent
      if (err.response?.data?.needs_verification) {
        navigate("/verify-otp", {
          state: {
            email: err.response.data.email,
            mode: "register",
            simulatedOtp: err.response.data.simulated_otp,
          },
        });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        backgroundImage: `linear-gradient(
          rgba(15, 81, 50, 0.75),
          rgba(25, 135, 84, 0.75)
        ), url(${tollBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="card shadow-lg"
        style={{
          width: "420px",
          borderRadius: "15px",
        }}
      >
        <div className="card-body p-5">
          
          {/* BACK TO HOME BUTTON */}
          <button 
            type="button"
            onClick={() => navigate("/")} 
            className="btn btn-sm btn-outline-secondary mb-3 border-0 p-0 text-muted"
            style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <FaArrowLeft /> Back to Home
          </button>

          <h2 className="text-center text-success mb-4">
            Intelligent Toll Management System
          </h2>

          {error && (
            <div
              className="alert alert-danger py-2"
              style={{ fontSize: "14px" }}
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">Email</label>

              <div className="input-group">
                <span className="input-group-text">
                  <FaUser />
                </span>

                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Password</label>

              <div className="input-group">
                <span className="input-group-text">
                  <FaLock />
                </span>

                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-success w-100"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Registration option */}
          <div className="text-center mt-4">
            <span className="text-muted">
              Don't have an account?{" "}
            </span>

            <button
              type="button"
              className="btn btn-link text-success fw-bold p-0 text-decoration-none"
              onClick={() => navigate("/register")}
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;