import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      if (data.user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'candidate') { setEmail('priya.sharma@email.com'); setPassword('password123'); }
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
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#lg)" /><path d="M8 16L13 21L24 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#12a866" /><stop offset="1" stopColor="#12a99b" /></linearGradient></defs></svg>
          </Link>
          <h1 className="auth-card__title">Welcome Back</h1>
          <p className="auth-card__subtitle">Sign in to your Switchera account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="spinner-sm" /> : 'Login'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div className="auth-demo">
            <p>Try demo accounts:</p>
            <div className="auth-demo__btns">
              <button onClick={() => fillDemo('candidate')} className="auth-demo__btn">👤 Candidate</button>
              <button onClick={() => fillDemo('employer')} className="auth-demo__btn">🏢 Employer</button>
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
