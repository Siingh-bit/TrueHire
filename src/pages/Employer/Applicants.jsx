import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

const STATUS_COLORS = { applied: 'primary', screening: 'secondary', assessment_pending: 'warning', assessment_completed: 'accent', shortlisted: 'success', interview: 'secondary', offered: 'success', hired: 'accent', rejected: 'danger' };
const STATUSES = ['applied', 'screening', 'assessment_pending', 'assessment_completed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];

export default function Applicants() {
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const REJECTION_REASONS = [
    'Requires more experience',
    'Missing specific skill',
    'Salary expectations mismatch',
    'Position filled',
    'Other'
  ];

  const loadApplicants = () => {
    api.getJobApplications(jobId).then(res => setApplicants(res.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { loadApplicants(); }, [jobId]);

  const updateStatus = async (appId, status, reason = null) => {
    if (status === 'rejected' && !reason) {
      setRejectingApp(appId);
      return;
    }
    await api.updateApplicationStatus(appId, status, reason);
    setRejectingApp(null);
    setRejectionReason('');
    loadApplicants();
  };

  const handleConfirmReject = () => {
    if (!rejectionReason) return;
    updateStatus(rejectingApp, 'rejected', rejectionReason);
  };

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  return (
    <div className="dashboard animate-fade-in-up">
      <Link to="/employer/jobs" className="btn btn--secondary btn--sm" style={{ marginBottom: 'var(--space-4)' }}>← Back to Jobs</Link>

      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Review <span>Applicants</span></h1>
        <p className="dashboard__subtitle">{applicants.length} candidates have applied</p>
      </div>

      {applicants.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state__icon">👥</div><div className="empty-state__title">No applicants yet</div><div className="empty-state__desc">Share your job posting to receive applications</div></div></div>
      ) : (
        <div className="job-cards">
          {applicants.map(app => (
            <div key={app.id} className="card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {app.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>{app.full_name}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>{app.headline}</div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>📍 {app.current_location}</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>💼 {app.total_experience_years}yr exp</span>
                      <span className={`v-badge v-badge--${app.verification_status}`}>
                        {app.verification_status === 'verified' ? '✅' : '⏳'} {app.verification_status}
                      </span>
                      {app.verification_score > 0 && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-400)' }}>Score: {app.verification_score}</span>}
                      {app.feedback_count > 0 && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-secondary-400)' }}>💬 {app.feedback_count} reviews</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <select className="filter-select" value={app.status} onChange={e => updateStatus(app.id, e.target.value)} style={{ marginBottom: '8px' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  {app.assessment?.score != null && (
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>Assessment: </span>
                      <span style={{ fontWeight: 600, color: app.assessment.score >= 70 ? 'var(--color-accent-400)' : 'var(--color-warning-400)' }}>{app.assessment.score}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
                {app.skills?.slice(0, 8).map(s => (
                  <span key={s.id} className="skill-tag" style={s.is_verified ? { borderColor: 'var(--color-accent-400)', background: 'rgba(0,217,148,0.1)' } : {}}>
                    {s.skill_name} {s.is_verified && '✓'}
                    {s.assessment_score && <span style={{ marginLeft: '4px', opacity: 0.7 }}>{s.assessment_score}%</span>}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: '8px' }}>
                <button className="btn btn--secondary btn--sm" onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                  {expanded === app.id ? 'Hide Details' : 'View Details'} ↓
                </button>
                <button className="btn btn--primary btn--sm" onClick={() => updateStatus(app.id, 'shortlisted')}>Shortlist</button>
                <button className="btn btn--danger btn--sm" onClick={() => updateStatus(app.id, 'rejected')}>Reject</button>
              </div>

              {expanded === app.id && (
                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-primary)' }}>
                  {app.video_cover_letter_url && (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <h4 style={{ marginBottom: '4px', fontSize: 'var(--font-size-sm)' }}>Video Pitch</h4>
                      <video src={app.video_cover_letter_url} controls style={{ width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  )}
                  {app.cover_letter && <div style={{ marginBottom: 'var(--space-4)' }}><h4 style={{ marginBottom: '4px', fontSize: 'var(--font-size-sm)' }}>Cover Letter</h4><p style={{ fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>"{app.cover_letter}"</p></div>}
                  {app.assessment && (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <h4 style={{ marginBottom: '4px', fontSize: 'var(--font-size-sm)' }}>Assessment Details</h4>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        <p>Score: {app.assessment.score}% | Proctoring: {app.assessment.proctoring_score}% | Status: {app.assessment.status}</p>
                      </div>
                    </div>
                  )}
                  {app.truehire_interviews && app.truehire_interviews.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ marginBottom: '8px', fontSize: 'var(--font-size-sm)', color: '#ff9800' }}>📹 TrueHire Validation Recording</h4>
                      {app.truehire_interviews.map(ti => (
                        <div key={ti.id} style={{ marginBottom: '8px' }}>
                          <p style={{ fontSize: 'var(--font-size-sm)' }}><strong>Status:</strong> {ti.status}</p>
                          {ti.feedback_notes && <p style={{ fontSize: 'var(--font-size-sm)', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>"{ti.feedback_notes}"</p>}
                          {ti.video_url && <a href={ti.video_url} target="_blank" rel="noreferrer" className="btn btn--sm btn--primary" style={{ marginTop: '8px' }}>Watch Interview</a>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingApp && (
        <div className="modal-overlay" onClick={() => setRejectingApp(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Reject Application</h3>
              <button className="modal__close" onClick={() => setRejectingApp(null)}>×</button>
            </div>
            <div className="auth-form">
              <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>To provide constructive feedback, please select a reason for rejection.</p>
              <div className="auth-field">
                <label>Reason</label>
                <select value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}>
                  <option value="">Select a reason...</option>
                  {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                <button className="btn btn--secondary" onClick={() => setRejectingApp(null)}>Cancel</button>
                <button className="btn btn--danger" disabled={!rejectionReason} onClick={handleConfirmReject}>Confirm Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
