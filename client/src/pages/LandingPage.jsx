import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="landing-container">
      
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="logo">
          <span style={{ color: '#198754', fontWeight: '800', letterSpacing: '1px' }}>ITMS</span>
        </div>
        <div className="nav-links">
          <button onClick={toggleTheme} className="theme-toggle-btn" style={{ marginRight: '10px' }}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/register" className="register-btn">Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <h1>Intelligent Toll Management System</h1>
          <p>
            A centralized, secure, and automated platform for seamless vehicle registration, 
            instant M-Pesa toll payments, and smart gate management.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="primary-btn">Get Started</Link>
            <Link to="/login" className="secondary-btn">Sign In</Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose ITMS?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon">🛣️</div>
            <h3>Expressway Ready</h3>
            <p>Built for modern highways. Manage multiple toll gates, locations, and dynamic rates effortlessly.</p>
          </div>
          <div className="feature-card">
            <div className="icon">📱</div>
            <h3>Instant M-Pesa Payments</h3>
            <p>Pay your toll fees securely from anywhere using our integrated M-Pesa STK push technology.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🛡️</div>
            <h3>Role-Based Access</h3>
            <p>Dedicated dashboards for Drivers and Administrators, ensuring strict operational control.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Intelligent Toll Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}