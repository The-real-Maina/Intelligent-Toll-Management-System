import { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import tollBg from "../assets/toll-bg.jpg";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", formData);
      localStorage.setItem("itms_token", res.data.token);
      localStorage.setItem("itms_user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 81, 50, 0.75), rgba(25, 135, 84, 0.75)), url(${tollBg})`,
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

        </div>
      </div>
    </div>
  );
}

export default Login;