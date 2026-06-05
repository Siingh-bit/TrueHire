import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, isCandidate, isEmployer, user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const displayName = profile?.full_name || profile?.company_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">
        <Link to="/" className="navbar__brand">
          <div className="navbar__logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
              <path d="M8 16L13 21L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#2d79f2" />
                  <stop offset="1" stopColor="#8b2dff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="navbar__brand-text">TrueHire</span>
        </Link>

        <button className="navbar__toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`} />
        </button>

        <div className={`navbar__menu ${menuOpen ? 'navbar__menu--open' : ''}`}>
          {!isAuthenticated ? (
            <>
              <Link to="/" className="navbar__link" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link to="/login" className="navbar__link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="navbar__btn navbar__btn--primary" onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            </>
          ) : isCandidate ? (
            <>
              <Link to="/candidate/dashboard" className="navbar__link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/candidate/jobs" className="navbar__link" onClick={() => setMenuOpen(false)}>Find Jobs</Link>
              <Link to="/candidate/applications" className="navbar__link" onClick={() => setMenuOpen(false)}>Applications</Link>
              <Link to="/candidate/profile" className="navbar__link" onClick={() => setMenuOpen(false)}>Profile</Link>
            </>
          ) : isEmployer ? (
            <>
              <Link to="/employer/dashboard" className="navbar__link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/employer/post-job" className="navbar__link" onClick={() => setMenuOpen(false)}>Post Job</Link>
              <Link to="/employer/jobs" className="navbar__link" onClick={() => setMenuOpen(false)}>Manage Jobs</Link>
            </>
          ) : user?.role === 'admin' ? (
            <>
              <Link to="/admin/dashboard" className="navbar__link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/admin/candidates" className="navbar__link" onClick={() => setMenuOpen(false)}>Candidates</Link>
              <Link to="/admin/pipeline" className="navbar__link" onClick={() => setMenuOpen(false)}>Pipeline</Link>
            </>
          ) : null}

          {isAuthenticated && (
            <div className="navbar__user" ref={dropdownRef}>
              <button className="navbar__avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="navbar__avatar">{initials}</div>
                <span className="navbar__user-name">{displayName}</span>
                <svg className={`navbar__chevron ${dropdownOpen ? 'navbar__chevron--open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="navbar__dropdown animate-scale-in">
                  <div className="navbar__dropdown-header">
                    <div className="navbar__dropdown-name">{displayName}</div>
                    <div className="navbar__dropdown-email">{user?.email}</div>
                    <div className="navbar__dropdown-role">{user?.role}</div>
                  </div>
                  <div className="navbar__dropdown-divider" />
                  {isCandidate && (
                    <Link to="/candidate/profile" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                      ⚙️ Profile Settings
                    </Link>
                  )}
                  {isCandidate && (
                    <Link to="/candidate/feedback/request" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                      💬 Manager Feedback
                    </Link>
                  )}
                  <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
