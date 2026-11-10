import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/* ---------- Theme (shares your existing body[data-theme] system) ---------- */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch { /* storage unavailable */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

/* ---------- Scene data ---------- */
// Driving on the left: cars on the left half drive away from us (tail-lights),
// cars on the right half come toward us (headlights).
const CARS = [
  { dir: 'away', lane: 'a', color: '#e63946', delay: '-3s',   dur: '15s' },
  { dir: 'away', lane: 'a', color: '#2563eb', delay: '-10.5s', dur: '15s' },
  { dir: 'away', lane: 'b', color: '#e2e8f0', delay: '-11s',  dur: '17s' },
  { dir: 'come', lane: 'c', color: '#f59e0b', delay: '-0.6s', dur: '4.4s' },
  { dir: 'come', lane: 'c', color: '#94a3b8', delay: '-2.8s', dur: '4.4s' },
  { dir: 'come', lane: 'd', color: '#10b981', delay: '-1.4s', dur: '5.2s' },
  { dir: 'come', lane: 'd', color: '#cbd5e1', delay: '-4s',   dur: '5.2s' },
];

const SKYLINE_HEIGHTS = [
  34, 52, 40, 76, 48, 30, 92, 58, 36, 64, 44, 110, 70, 40, 52, 84, 38, 60,
  46, 98, 54, 34, 72, 42, 56, 88, 40, 50, 66, 36, 48, 78, 44, 32,
];

const STATS = [
  { value: '24/7', label: 'Automated operations' },
  { value: '100%', label: 'Cashless payments' },
  { value: '0s', label: 'Gate wait time' },
  { value: '3', label: 'Secure user roles' },
];

const LANES = [
  {
    title: 'Expressway ready',
    text: 'Built for modern highways. Manage multiple toll gates, locations, and dynamic rates effortlessly.',
    icon: (
      <>
        <path d="M9 3 3 21M15 3l6 18" />
        <path d="M12 4v3M12 10v4M12 17v4" />
      </>
    ),
  },
  {
    title: 'Instant M-Pesa payments',
    text: 'Pay your toll fees securely from anywhere using our integrated M-Pesa STK push technology.',
    icon: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2M9.5 10.5l2 2 3-3.5" />
      </>
    ),
  },
  {
    title: 'Role-based access',
    text: 'Dedicated dashboards for Drivers and Administrators, ensuring strict operational control.',
    icon: (
      <>
        <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
];

/* ---------- Small pieces ---------- */
function Logo() {
  return (
    <span className="lp-logo">
      <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#198754" />
        <path d="M13 6h6l7 21H6z" fill="#1b2230" />
        <path d="M16 9v3M16 15v4M16 22v4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="lp-logo-text">ITMS</span>
    </span>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="lp-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
    >
      <svg
        key={theme}
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}

function HighwayScene() {
  return (
    <div className="lp-scene" aria-hidden="true">
      <div className="lp-stars" />
      <div className="lp-orb" />

      <svg className="lp-skyline" viewBox="0 0 1224 120" preserveAspectRatio="none">
        {SKYLINE_HEIGHTS.map((h, i) => (
          <rect key={i} x={i * 36} y={120 - h} width="36" height={h} />
        ))}
        <rect x={11 * 36 + 16} y={120 - 110 - 20} width="4" height="20" />
        <rect x={19 * 36 + 16} y={120 - 98 - 16} width="4" height="16" />
      </svg>

      <div className="lp-ground" />

      <div className="lp-persp">
        <div className="lp-plane">
          <div className="lp-pools" />
          <span className="lp-edge l" />
          <span className="lp-edge r" />
          <span className="lp-median" />
          <span className="lp-dash d1" />
          <span className="lp-dash d2" />
          {CARS.map((c, i) => (
            <div
              key={i}
              className={`lp-car ${c.dir} lane-${c.lane}`}
              style={{ '--car': c.color, animationDelay: c.delay, animationDuration: c.dur }}
            >
              <i />
            </div>
          ))}
        </div>
      </div>

      <div className="lp-haze" />

      <div className="lp-gantry">
        <div className="lp-gantry-sign">
          <span>Toll plaza</span>
          <strong>M-Pesa lanes open</strong>
        </div>
        <div className="lp-lamps">
          <i /><i /><i /><i />
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function LandingPage() {
  const [theme, toggleTheme] = useTheme();

  return (
    <div className="lp">
      {/* Navbar */}
      <nav className="lp-nav">
        <Logo />
        <div className="lp-nav-links">
          <Link to="/login" className="lp-link">Login</Link>
          <Link to="/register" className="lp-register">Register</Link>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </nav>

      {/* Hero */}
      <header className="lp-hero">
        <HighwayScene />
        <div className="lp-scrim" />
        <div className="lp-hero-content">
          <h1>Serving Kenya&rsquo;s drivers seamlessly.</h1>
          <p>
            The Intelligent Toll Management System (ITMS) is the easiest and preferred way to pay
            tolls. Register your vehicle, pay instantly via M-Pesa, and pass through gates without
            delays.
          </p>
          <div className="lp-buttons">
            <Link to="/register" className="lp-btn-primary">Get started</Link>
            <Link to="/login" className="lp-btn-secondary">Sign in</Link>
          </div>
        </div>
      </header>

      {/* Stats on a highway sign */}
      <section className="lp-signwrap" aria-label="ITMS at a glance">
        <div className="lp-sign">
          {STATS.map((s) => (
            <div className="lp-stat" key={s.label}>
              <div className="lp-num">{s.value}</div>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features: three lanes */}
      <section className="lp-features">
        <div className="lp-features-head">
          <h2>Investing in a faster future.</h2>
          <p>
            As populations increase and economies grow, ITMS is working to ensure toll roads remain
            reliable, congestion-free alternatives to local highways.
          </p>
        </div>

        <div className="lp-lanes">
          {LANES.map((l) => (
            <article className="lp-lane" key={l.title}>
              <span className="lp-lane-sign">
                <svg
                  viewBox="0 0 24 24"
                  width="34"
                  height="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {l.icon}
                </svg>
              </span>
              <svg className="lp-arrow" viewBox="0 0 40 120" aria-hidden="true">
                <path d="M20 0 38 38H26V120H14V38H2z" fill="currentColor" />
              </svg>
              <h3>{l.title}</h3>
              <p>{l.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="lp-cta">
        <h2>Your lane is open.</h2>
        <p>Register your vehicle once and drive through every toll gate without stopping.</p>
        <Link to="/register" className="lp-btn-primary">Create your account</Link>
      </section>

      {/* Footer with a rumble strip */}
      <footer className="lp-footer">
        <p>&copy; {new Date().getFullYear()} Intelligent Toll Management System. All rights reserved.</p>
        <div className="lp-footer-links">
          <a href="#">Terms of Use</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
}