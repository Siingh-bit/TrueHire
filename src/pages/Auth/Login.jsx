import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const { login, sendOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await sendOtp(email, 'login', password);
      setOtpSent(true);
      if (res.devOtp) {
        setMessage(`OTP sent! (Dev Mode: ${res.devOtp})`);
      } else {
        setMessage('OTP sent to your email! It expires in 10 minutes.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password, otp);
      if (data.user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'candidate') { setEmail('priya.sharma@email.com'); setPassword('password123'); }
    else if (type === 'admin') { setEmail('admin@truehire.com'); setPassword('password123'); }
    else { setEmail('hr@technova.com'); setPassword('password123'); }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg">
        <div className="auth-page__orb auth-page__orb--1" />
        <div className="auth-page__orb auth-page__orb--2" />
      </div>
      <div className="auth-card animate-fade-in-up">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#lg)" /><path d="M8 16L13 21L24 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#2d79f2" /><stop offset="1" stopColor="#8b2dff" /></linearGradient></defs></svg>
          </Link>
          <h1 className="auth-card__title">{otpSent ? 'Enter Verification Code' : 'Welcome Back'}</h1>
          <p className="auth-card__subtitle">{otpSent ? 'Check your email for the 6-digit code' : 'Sign in to your TrueHire account'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success-400)', borderRadius: '8px', fontSize: '14px' }}>{message}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="auth-field">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="spinner-sm" /> : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label>6-Digit OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" required maxLength={6} style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="auth-submit" style={{ background: 'rgba(255,255,255,0.05)', flex: '0 0 auto', width: 'auto', padding: '0 20px' }} onClick={() => setOtpSent(false)}>← Back</button>
              <button type="submit" className="auth-submit" disabled={loading || otp.length < 6}>
                {loading ? <span className="spinner-sm" /> : 'Verify & Login'}
              </button>
            </div>
          </form>
        )}

        {!otpSent && (
          <div className="auth-demo">
            <p>Try demo accounts:</p>
            <div className="auth-demo__btns">
              <button onClick={() => fillDemo('candidate')} className="auth-demo__btn">👤 Candidate</button>
              <button onClick={() => fillDemo('employer')} className="auth-demo__btn">🏢 Employer</button>
              <button onClick={() => fillDemo('admin')} className="auth-demo__btn">🛡️ Admin</button>
            </div>
          </div>
        )}

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
