import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import TollGates from "./pages/TollGates";
import Users from "./pages/Users";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import PayNow from "./pages/PayNow";
import AttendantDashboard from "./pages/AttendantDashboard"; // <-- Imported
import ProtectedRoute from "./components/ProtectedRoute";

function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme">
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}

function App() {
  const location = useLocation();
  const showGlobalToggle = location.pathname !== "/";

  return (
    <div className="app-wrapper">
      {showGlobalToggle && <ThemeToggle />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
        <Route path="/toll-gates" element={<ProtectedRoute><TollGates /></ProtectedRoute>} />
        <Route path="/tollgates" element={<ProtectedRoute><TollGates /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/pay" element={<ProtectedRoute><PayNow /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {/* Attendant Only Route */}
        <Route path="/verify-gate" element={<ProtectedRoute allowedRoles={["Toll Attendant"]}><AttendantDashboard /></ProtectedRoute>} />

        {/* Admin Only Routes */}
        <Route path="/users" element={<ProtectedRoute allowedRoles={["Admin"]}><Users /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={["Admin"]}><Reports /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default function WrappedApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}