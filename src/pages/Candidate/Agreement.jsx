import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import '../Auth/Login.css';

export default function Agreement() {
  const [agreement, setAgreement] = useState(null);
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    api.getAgreement().then(res => {
      if (res.success) {
        setAgreement(res.data);
        const initial = {};
        res.data.clauses.forEach(c => initial[c.id] = false);
        setChecked(initial);
      }
    });
  }, []);

  const allChecked = agreement?.clauses?.every(c => checked[c.id]);

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    try {
      await api.acceptAgreement();
      await refreshProfile();
      navigate('/candidate/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to accept agreement');
    } finally {
      setLoading(false);
    }
  };

  if (!agreement) return <div className="auth-page"><div className="auth-card animate-fade-in-up"><p style={{color:'var(--color-text-secondary)'}}>Loading agreement...</p></div></div>;

  return (
    <div className="auth-page">
      <div className="auth-page__bg">
        <div className="auth-page__orb auth-page__orb--1" />
        <div className="auth-page__orb auth-page__orb--2" />
      </div>
      <div className="auth-card auth-card--wide animate-fade-in-up" style={{ maxWidth: '720px' }}>
        <div className="auth-card__header">
          <h1 className="auth-card__title">{agreement.title}</h1>
          <p className="auth-card__subtitle">Version {agreement.version} • Last updated: {agreement.lastUpdated}</p>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: 'var(--space-4)', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {agreement.clauses.map(clause => (
            <label key={clause.id} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', cursor: 'pointer', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={checked[clause.id] || false}
                onChange={() => setChecked(prev => ({ ...prev, [clause.id]: !prev[clause.id] }))}
                style={{ marginTop: '4px', accentColor: 'var(--color-primary-500)', width: '18px', height: '18px', flexShrink: 0 }}
              />
              <div>
                <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '4px' }}>{clause.title}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{clause.text}</div>
              </div>
            </label>
          ))}
        </div>
        <button className="auth-submit" disabled={!allChecked || loading} onClick={handleAccept}>
          {loading ? <span className="spinner-sm" /> : 'I Accept All Terms & Conditions'}
        </button>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', textAlign: 'center', marginTop: 'var(--space-3)' }}>
          By accepting, you agree to all clauses above. Your acceptance will be recorded with a timestamp and IP address.
        </p>
      </div>
    </div>
  );
}
