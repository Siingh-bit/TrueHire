import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function SubmitFeedback() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ overall_rating: 4, technical_rating: 4, communication_rating: 4, leadership_rating: 3, strengths: '', areas_of_improvement: '', would_rehire: true, comments: '' });

  useEffect(() => {
    api.verifyFeedbackToken(token).then(res => setInfo(res.data)).catch(err => setError(err.message || 'Invalid or expired link')).finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitFeedback(token, formData);
      setSubmitted(true);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="dashboard" style={{ paddingTop: '120px' }}><div className="page-loader"><div className="spinner" /></div></div>;

  if (submitted) return (
    <div className="dashboard" style={{ paddingTop: '120px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <div className="auth-success"><div className="auth-success__icon">🎉</div><h2 className="auth-success__title">Thank You!</h2><p className="auth-success__desc">Your feedback has been submitted successfully and will help verify the candidate's profile.</p></div>
    </div>
  );

  if (error && !info) return (
    <div className="dashboard" style={{ paddingTop: '120px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <div className="auth-success"><div className="auth-success__icon">❌</div><h2 className="auth-success__title">Invalid Link</h2><p className="auth-success__desc">{error}</p></div>
    </div>
  );

  const RatingInput = ({ label, field }) => (
    <div className="auth-field">
      <label>{label}: <strong>{formData[field]}/5</strong></label>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => setFormData({...formData, [field]: n})} style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: `2px solid ${formData[field] === n ? 'var(--color-primary-500)' : 'var(--color-border-primary)'}`, background: formData[field] === n ? 'rgba(18, 168, 102,0.15)' : 'transparent', color: formData[field] === n ? 'var(--color-primary-400)' : 'var(--color-text-tertiary)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-size-sm)', transition: 'all 0.2s' }}>
            {n} {'⭐'.repeat(n > 3 ? 1 : 0)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard animate-fade-in-up" style={{ paddingTop: '100px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 'var(--space-2)' }}>Manager Feedback Form</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>You've been invited to provide feedback for <strong style={{ color: 'var(--color-primary-400)' }}>{info?.candidate_name}</strong></p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>Company: {info?.company_name} | Requested by: {info?.manager_name}</p>
        </div>

        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <form onSubmit={handleSubmit} className="auth-form">
            <RatingInput label="Overall Performance" field="overall_rating" />
            <RatingInput label="Technical Skills" field="technical_rating" />
            <RatingInput label="Communication" field="communication_rating" />
            <RatingInput label="Leadership" field="leadership_rating" />

            <div className="auth-field"><label>Key Strengths</label><textarea rows={3} value={formData.strengths} onChange={e => setFormData({...formData, strengths: e.target.value})} placeholder="What are their strongest qualities?" style={{ width: '100%', padding: 'var(--space-3)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', resize: 'vertical' }} /></div>
            <div className="auth-field"><label>Areas of Improvement</label><textarea rows={3} value={formData.areas_of_improvement} onChange={e => setFormData({...formData, areas_of_improvement: e.target.value})} placeholder="Where could they improve?" style={{ width: '100%', padding: 'var(--space-3)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', resize: 'vertical' }} /></div>
            <div className="auth-field"><label>Would you rehire this person?</label><select value={formData.would_rehire ? 'yes' : 'no'} onChange={e => setFormData({...formData, would_rehire: e.target.value === 'yes'})}><option value="yes">Yes, absolutely</option><option value="no">No</option></select></div>
            <div className="auth-field"><label>Additional Comments</label><textarea rows={3} value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} placeholder="Any other feedback..." style={{ width: '100%', padding: 'var(--space-3)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', resize: 'vertical' }} /></div>

            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }} disabled={submitting}>{submitting ? 'Submitting...' : '✅ Submit Feedback'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
