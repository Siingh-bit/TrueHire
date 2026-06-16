import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', phone: '', headline: '', total_experience_years: '', company_name: '', industry: '', company_size: '', website: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { register, sendOtp } = useAuth();
  const navigate = useNavigate();

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleNext = () => {
    if (step === 1 && !role) { setError('Please select a role'); return; }
    setError('');
    setStep(step + 1);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (role === 'candidate' && Number(formData.total_experience_years) < 3) {
      setError('Minimum 3 years of experience required'); return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await sendOtp(formData.email, 'register');
      setStep(3); // Go to OTP step
      if (res.devOtp) {
        setMessage(`OTP sent! (Dev Mode: ${res.devOtp})`);
      } else {
        setMessage('OTP sent to your email! It expires in 10 minutes.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Email may be already registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register({ ...formData, role, otp, total_experience_years: Number(formData.total_experience_years) });
      setStep(4); // Success step
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg">
        <div className="auth-page__orb auth-page__orb--1" />
        <div className="auth-page__orb auth-page__orb--2" />
      </div>
      <div className="auth-card auth-card--wide animate-fade-in-up">
        <div className="auth-steps">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`auth-step ${s === step ? 'auth-step--active' : ''} ${s < step ? 'auth-step--done' : ''}`} style={{ flex: 1 }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="auth-card__header">
              <h1 className="auth-card__title">Join Switchera</h1>
              <p className="auth-card__subtitle">Select how you want to use the platform</p>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <div className="role-cards">
              <div className={`role-card ${role === 'candidate' ? 'role-card--selected' : ''}`} onClick={() => setRole('candidate')}>
                <div className="role-card__icon">👤</div>
                <div className="role-card__title">Candidate</div>
                <div className="role-card__desc">Find verified job opportunities</div>
              </div>
              <div className={`role-card ${role === 'employer' ? 'role-card--selected' : ''}`} onClick={() => setRole('employer')}>
                <div className="role-card__icon">🏢</div>
                <div className="role-card__title">Employer</div>
                <div className="role-card__desc">Hire verified professionals</div>
              </div>
            </div>
            <button className="auth-submit" onClick={handleNext}>Continue →</button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="auth-card__header">
              <h1 className="auth-card__title">{role === 'candidate' ? 'Your Details' : 'Company Details'}</h1>
              <p className="auth-card__subtitle">Tell us about {role === 'candidate' ? 'yourself' : 'your company'}</p>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSendOtp} className="auth-form">
              {role === 'candidate' ? (
                <>
                  <div className="auth-field">
                    <label>Full Name *</label>
                    <input type="text" value={formData.full_name} onChange={e => updateField('full_name', e.target.value)} placeholder="Your full name" required />
                  </div>
                  <div className="auth-row">
                    <div className="auth-field">
                      <label>Email *</label>
                      <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="you@email.com" required />
                    </div>
                    <div className="auth-field">
                      <label>Password *</label>
                      <input type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                    </div>
                  </div>
                  <div className="auth-row">
                    <div className="auth-field">
                      <label>Phone</label>
                      <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+91-XXXXXXXXXX" />
                    </div>
                    <div className="auth-field">
                      <label>Total Experience (Years) *</label>
                      <input type="number" min="3" value={formData.total_experience_years} onChange={e => updateField('total_experience_years', e.target.value)} placeholder="Min 3 years" required />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>Professional Headline</label>
                    <input type="text" value={formData.headline} onChange={e => updateField('headline', e.target.value)} placeholder="e.g. Senior Data Analyst | Python | SQL" />
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-field">
                    <label>Company Name *</label>
                    <input type="text" value={formData.company_name} onChange={e => updateField('company_name', e.target.value)} placeholder="Your company name" required />
                  </div>
                  <div className="auth-row">
                    <div className="auth-field">
                      <label>Email *</label>
                      <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="hr@company.com" required />
                    </div>
                    <div className="auth-field">
                      <label>Password *</label>
                      <input type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                    </div>
                  </div>
                  <div className="auth-row">
                    <div className="auth-field">
                      <label>Industry</label>
                      <select value={formData.industry} onChange={e => updateField('industry', e.target.value)}>
                        <option value="">Select industry</option>
                        <option>Information Technology</option>
                        <option>Cloud Computing</option>
                        <option>Data & Analytics</option>
                        <option>Finance</option>
                        <option>Healthcare</option>
                        <option>E-commerce</option>
                        <option>Education</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label>Company Size</label>
                      <select value={formData.company_size} onChange={e => updateField('company_size', e.target.value)}>
                        <option value="">Select size</option>
                        <option>1-50</option>
                        <option>50-200</option>
                        <option>200-500</option>
                        <option>500-1000</option>
                        <option>1000-5000</option>
                        <option>5000+</option>
                      </select>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>Website</label>
                    <input type="url" value={formData.website} onChange={e => updateField('website', e.target.value)} placeholder="https://company.com" />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button type="button" className="auth-submit" style={{ background: 'rgba(255,255,255,0.05)', flex: '0 0 auto', width: 'auto', padding: '0 var(--space-6)' }} onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? <span className="spinner-sm" /> : 'Send Verification Code'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div className="auth-card__header">
              <h1 className="auth-card__title">Verify Email</h1>
              <p className="auth-card__subtitle">We've sent a 6-digit code to {formData.email}</p>
            </div>
            
            {error && <div className="auth-error">{error}</div>}
            {message && <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success-400)', borderRadius: '8px', fontSize: '14px' }}>{message}</div>}

            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-field">
                <label>6-Digit OTP</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" required maxLength={6} style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="auth-submit" style={{ background: 'rgba(255,255,255,0.05)', flex: '0 0 auto', width: 'auto', padding: '0 20px' }} onClick={() => setStep(2)}>← Back</button>
                <button type="submit" className="auth-submit" disabled={loading || otp.length < 6}>
                  {loading ? <span className="spinner-sm" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 4 && (
          <div className="auth-success">
            <div className="auth-success__icon">🎉</div>
            <h2 className="auth-success__title">Welcome to Switchera!</h2>
            <p className="auth-success__desc">Your account has been created successfully.</p>
            <button className="auth-submit" onClick={() => navigate(role === 'candidate' ? '/candidate/dashboard' : '/employer/dashboard')}>
              Go to Dashboard →
            </button>
          </div>
        )}

        {step !== 4 && (
          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
