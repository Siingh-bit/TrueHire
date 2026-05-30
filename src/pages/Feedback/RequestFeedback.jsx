import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function RequestFeedback() {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({ manager_name: '', manager_email: '', manager_title: '', company_name: '', relationship: 'direct_manager', worked_from: '', worked_to: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.requestFeedback(formData);
      setResult(res);
      setFormData({ manager_name: '', manager_email: '', manager_title: '', company_name: '', relationship: 'direct_manager', worked_from: '', worked_to: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Request Manager <span>Feedback</span></h1>
        <p className="dashboard__subtitle">Optional — invite past managers to endorse your work (this is not mandatory)</p>
      </div>

      {result && (
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', borderColor: 'var(--color-accent-500)' }}>
          <h3 style={{ color: 'var(--color-accent-400)', marginBottom: 'var(--space-2)' }}>✅ Feedback Request Sent!</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>{result.message}</p>
          <div style={{ padding: 'var(--space-3)', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', wordBreak: 'break-all' }}>
            {window.location.origin}/feedback/submit/{result.data?.verification_token}
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2)' }}>Share this link with your manager to submit their feedback.</p>
        </div>
      )}

      {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      <div className="card" style={{ padding: 'var(--space-8)', maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field"><label>Manager's Full Name *</label><input required value={formData.manager_name} onChange={e => setFormData({...formData, manager_name: e.target.value})} placeholder="e.g. Rajesh Kumar" /></div>
          <div className="auth-row">
            <div className="auth-field"><label>Manager's Email *</label><input type="email" required value={formData.manager_email} onChange={e => setFormData({...formData, manager_email: e.target.value})} placeholder="manager@company.com" /></div>
            <div className="auth-field"><label>Title/Designation</label><input value={formData.manager_title} onChange={e => setFormData({...formData, manager_title: e.target.value})} placeholder="e.g. Engineering Manager" /></div>
          </div>
          <div className="auth-row">
            <div className="auth-field"><label>Company Name *</label><input required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} placeholder="Company you worked at together" /></div>
            <div className="auth-field"><label>Relationship</label><select value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})}><option value="direct_manager">Direct Manager</option><option value="skip_level_manager">Skip-level Manager</option><option value="team_lead">Team Lead</option><option value="project_manager">Project Manager</option><option value="cto">CTO/VP</option></select></div>
          </div>
          <div className="auth-row">
            <div className="auth-field"><label>Worked From</label><input type="date" value={formData.worked_from} onChange={e => setFormData({...formData, worked_from: e.target.value})} /></div>
            <div className="auth-field"><label>Worked To</label><input type="date" value={formData.worked_to} onChange={e => setFormData({...formData, worked_to: e.target.value})} /></div>
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Sending...' : '📧 Send Feedback Request'}</button>
        </form>
      </div>
    </div>
  );
}
