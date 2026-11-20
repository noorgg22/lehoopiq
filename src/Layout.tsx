import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',          label: 'Today' },
  { to: '/standings', label: 'Standings' },
  { to: '/leaders',   label: 'Leaders' },
  { to: '/teams',     label: 'Teams' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState('');

  useEffect(() => {
    const update = () =>
      setNow(
        new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ink)',
        color: 'var(--chalk)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ── Desktop Nav ───────────────────────────────────────── */}
      <header className="nav-bar">
        <div className="nav-inner">
          {/* Logo */}
          <NavLink to="/" className="nav-logo" aria-label="Home">
            <div className="nav-logo-tile">
              <img
                src="/logo.png"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <span className="nav-wordmark">
              LeHoop<span style={{ color: 'var(--heat)' }}>IQ</span>
            </span>
          </NavLink>

          {/* Divider */}
          <div className="nav-divider" />

          {/* Links (desktop only) */}
          <nav className="nav-links">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `nav-pill${isActive ? ' nav-pill--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="nav-right">
            {now && (
              <span className="nav-updated">Updated {now}</span>
            )}
          </div>

          {/* Hamburger (mobile only) */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <nav className="nav-mobile-menu">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `nav-mobile-link${isActive ? ' nav-mobile-link--active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────────── */}
      <nav className="nav-bottom-tabs">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `nav-bottom-tab${isActive ? ' nav-bottom-tab--active' : ''}`
            }
          >
            <span className="nav-bottom-tab-icon">
              {item.label === 'Today' && '\u2302'}
              {item.label === 'Standings' && '\u2630'}
              {item.label === 'Leaders' && '\u2605'}
              {item.label === 'Teams' && '\u26BD'}
            </span>
            <span className="nav-bottom-tab-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Page Content ──────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 'var(--max-w)',
          margin: '0 auto',
          padding: 'var(--sp-6) var(--sp-6) var(--sp-16)',
        }}
      >
        <Outlet />
      </main>

      {/* ── Scoped Styles ─────────────────────────────────────── */}
      <style>{`
        /* ---- Top bar ---- */
        .nav-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--ink);
          border-bottom: 1px solid var(--line);
        }
        .nav-inner {
          max-width: var(--max-w);
          margin: 0 auto;
          height: 56px;
          padding: 0 var(--sp-6);
          display: flex;
          align-items: center;
          gap: var(--sp-5);
        }

        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          text-decoration: none;
          color: var(--chalk);
          flex-shrink: 0;
        }
        .nav-logo-tile {
          width: 30px;
          height: 30px;
          border-radius: var(--r-sm);
          background: var(--heat);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-wordmark {
          font-family: var(--font-display);
          font-size: var(--t-lg);
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        /* Divider */
        .nav-divider {
          width: 1px;
          height: 20px;
          background: var(--line);
          flex-shrink: 0;
        }

        /* Links */
        .nav-links {
          display: flex;
          gap: var(--sp-1);
          flex: 1;
        }
        .nav-pill {
          padding: 5px 14px;
          border-radius: var(--r-sm);
          font-size: var(--t-sm);
          font-weight: 500;
          color: var(--chalk-2);
          text-decoration: none;
          transition: background 150ms ease, color 150ms ease;
        }
        .nav-pill:hover {
          color: var(--chalk);
        }
        .nav-pill--active {
          background: rgba(229, 50, 45, 0.12);
          color: var(--heat);
        }

        /* Right */
        .nav-right {
          display: flex;
          align-items: center;
          gap: var(--sp-4);
          flex-shrink: 0;
        }
        .nav-updated {
          font-size: var(--t-xs);
          color: var(--chalk-2);
          font-family: var(--font-body);
        }

        /* Hamburger */
        .nav-hamburger {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }
        .nav-hamburger span {
          display: block;
          width: 20px;
          height: 2px;
          background: var(--chalk-2);
          border-radius: 2px;
        }

        /* Mobile dropdown menu */
        .nav-mobile-menu {
          display: none;
          flex-direction: column;
          padding: var(--sp-2) var(--sp-6) var(--sp-4);
          border-top: 1px solid var(--line);
        }
        .nav-mobile-link {
          padding: var(--sp-3) var(--sp-4);
          border-radius: var(--r-sm);
          font-size: var(--t-sm);
          font-weight: 500;
          color: var(--chalk-2);
          text-decoration: none;
        }
        .nav-mobile-link--active {
          background: rgba(229, 50, 45, 0.12);
          color: var(--heat);
        }

        /* Bottom tabs */
        .nav-bottom-tabs {
          display: none;
        }
        .nav-bottom-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          flex: 1;
          padding: 6px 0;
          text-decoration: none;
          color: var(--chalk-2);
          font-size: 10px;
          font-weight: 600;
          transition: color 150ms ease;
        }
        .nav-bottom-tab--active {
          color: var(--heat);
        }
        .nav-bottom-tab-icon {
          font-size: 18px;
          line-height: 1;
        }
        .nav-bottom-tab-label {
          font-family: var(--font-body);
        }

        /* ---- Responsive ---- */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          .nav-divider {
            display: none;
          }
          .nav-right {
            display: none;
          }
          .nav-hamburger {
            display: flex;
            margin-left: auto;
          }
          .nav-mobile-menu {
            display: flex;
          }
          .nav-bottom-tabs {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
            background: var(--ink);
            border-top: 1px solid var(--line);
            padding: 4px 0 env(safe-area-inset-bottom, 4px);
          }
          main {
            padding-bottom: 80px !important;
          }
        }
      `}</style>
    </div>
  );
}
