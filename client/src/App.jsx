import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import useTheme from "./hooks/useTheme";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import TollGates from "./pages/TollGates";
import Users from "./pages/Users";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import PayNow from "./pages/PayNow";
import AttendantHome from "./pages/AttendantHome";
import AttendantShiftLog from "./pages/AttendantShiftLog";
import AttendantVerify from "./pages/AttendantVerify";
import AttendantCash from "./pages/AttendantCash";
import AttendantCitation from "./pages/AttendantCitation";
import AttendantProfile from "./pages/AttendantProfile";
import AttendantShift from "./pages/AttendantShift";
import EmployeeManagement from "./pages/EmployeeManagement";
import AuditLogs from "./pages/AuditLogs";
import DriverWallet from "./pages/DriverWallet";
import AdminDisputes from "./pages/AdminDisputes";
import Companies from "./pages/Companies";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompanyVehicles from "./pages/CompanyVehicles";
import CompanyDrivers from "./pages/CompanyDrivers";
import CompanyPayments from "./pages/CompanyPayments";
import CompanyReports from "./pages/CompanyReports";
import ProtectedRoute from "./components/ProtectedRoute";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle dark mode" title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}

function App() {
  const location = useLocation();
  useTheme();
  const showGlobalToggle = location.pathname !== "/";

  return (
    <div className="app-wrapper">
      {showGlobalToggle && <ThemeToggle />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/pay" element={<ProtectedRoute><PayNow /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AttendantProfile /></ProtectedRoute>} />

        <Route path="/vehicles" element={<ProtectedRoute allowedRoles={["Driver"]}><Vehicles /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute allowedRoles={["Driver"]}><DriverWallet /></ProtectedRoute>} />

        <Route path="/toll-gates" element={<ProtectedRoute allowedRoles={["Admin"]}><TollGates /></ProtectedRoute>} />
        <Route path="/tollgates" element={<ProtectedRoute allowedRoles={["Admin"]}><TollGates /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute allowedRoles={["Admin"]}><Users /></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute allowedRoles={["Admin"]}><Companies /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={["Admin"]}><Reports /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={["Admin"]}><AuditLogs /></ProtectedRoute>} />
        <Route path="/employee-management" element={<ProtectedRoute allowedRoles={["Admin"]}><EmployeeManagement /></ProtectedRoute>} />
        <Route path="/disputes" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDisputes /></ProtectedRoute>} />

        <Route path="/company-dashboard" element={<ProtectedRoute allowedRoles={["Company Admin"]}><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/company-vehicles" element={<ProtectedRoute allowedRoles={["Company Admin"]}><CompanyVehicles /></ProtectedRoute>} />
        <Route path="/company-drivers" element={<ProtectedRoute allowedRoles={["Company Admin"]}><CompanyDrivers /></ProtectedRoute>} />
        <Route path="/company-payments" element={<ProtectedRoute allowedRoles={["Company Admin"]}><CompanyPayments /></ProtectedRoute>} />
        <Route path="/company-reports" element={<ProtectedRoute allowedRoles={["Company Admin"]}><CompanyReports /></ProtectedRoute>} />

        <Route path="/attendant-home" element={<ProtectedRoute allowedRoles={["Toll Attendant"]}><AttendantHome /></ProtectedRoute>} />
        <Route path="/verify-gate" element={<ProtectedRoute allowedRoles={["Toll Attendant"]}><AttendantVerify /></ProtectedRoute>} />
        <Route path="/record-cash" element={<ProtectedRoute allowedRoles={["Toll Attendant"]}><AttendantCash /></ProtectedRoute>} />
        <Route path="/issue-citation" element={<ProtectedRoute allowedRoles={["Toll Attendant"]}><AttendantCitation /></ProtectedRoute>} />
        <Route path="/attendant-shift-log" element={<ProtectedRoute allowedRoles={["Toll Attendant"]}><AttendantShiftLog /></ProtectedRoute>} />
        <Route path="/my-shift" element={<ProtectedRoute allowedRoles={["Toll Attendant"]}><AttendantShift /></ProtectedRoute>} />
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