import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

const STATUS_COLORS = { applied: 'primary', screening: 'secondary', assessment_pending: 'warning', assessment_completed: 'accent', shortlisted: 'success', interview: 'secondary', offered: 'success', hired: 'accent', rejected: 'danger' };
const STATUS_LABELS = { applied: 'Applied', screening: 'Under Review', assessment_pending: 'Assessment Pending', assessment_completed: 'Assessment Done', shortlisted: 'Shortlisted', interview: 'Interview', offered: 'Offered', hired: 'Hired', rejected: 'Rejected' };

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getMyApplications().then(res => setApps(res.data || [])).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">My <span>Applications</span></h1>
        <p className="dashboard__subtitle">Track all your job applications and assessment statuses</p>
      </div>

      <div className="tabs">
        {['all', 'applied', 'assessment_pending', 'assessment_completed', 'shortlisted', 'interview', 'offered'].map(t => (
          <button key={t} className={`tab ${filter === t ? 'tab--active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'all' ? `All (${apps.length})` : `${STATUS_LABELS[t]} (${apps.filter(a => a.status === t).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state__icon">📋</div><div className="empty-state__title">No applications</div><div className="empty-state__desc">{filter === 'all' ? 'Start applying to jobs!' : 'No applications with this status'}</div><Link to="/candidate/jobs" className="btn btn--primary">Browse Jobs</Link></div></div>
      ) : (
        <div className="job-cards">
          {filtered.map(app => (
            <div key={app.id} className="card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)', marginBottom: '2px' }}>{app.job_title}</div>
                  <div style={{ color: 'var(--color-primary-400)' }}>{app.company_name}</div>
                </div>
                <span className={`badge badge--${STATUS_COLORS[app.status]}`}>{STATUS_LABELS[app.status]}</span>
              </div>
              <div className="job-card__meta">
                <span className="job-card__meta-item">📍 {app.job_location}</span>
                <span className="job-card__meta-item">💼 {app.job_type}</span>
                <span className="job-card__meta-item">📅 Applied {new Date(app.applied_at).toLocaleDateString()}</span>
              </div>
              {app.assessment_score && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>Assessment Score</span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: app.assessment_score >= 70 ? 'var(--color-accent-400)' : 'var(--color-warning-400)' }}>{app.assessment_score}%</span>
                  </div>
                  <div className="score-bar"><div className={`score-bar__fill score-bar__fill--${app.assessment_score >= 70 ? 'high' : app.assessment_score >= 50 ? 'medium' : 'low'}`} style={{ width: `${app.assessment_score}%` }} /></div>
                </div>
              )}
              {app.status === 'assessment_pending' && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  {app.assessment?.id ? (
                    <Link to={`/assessment/${app.assessment.id}`} className="btn btn--primary btn--sm">🧠 Take Assessment →</Link>
                  ) : (
                    <GenerateBtn applicationId={app.id} />
                  )}
                </div>
              )}
              {app.assessment?.id && app.status === 'assessment_completed' && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Link to={`/assessment/${app.assessment.id}/results`} className="btn btn--secondary btn--sm">📊 View Results</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GenerateBtn({ applicationId }) {
  const [loading, setLoading] = useState(false);
  const [assessmentId, setAssessmentId] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.generateAssessment(applicationId);
      setAssessmentId(res.data?.id);
    } catch (err) {
      if (err.message.includes('already exists')) {
        // Assessment exists, try to get the ID
        alert('Assessment already generated. Refreshing...');
        window.location.reload();
      }
    }
    setLoading(false);
  };

  if (assessmentId) return <Link to={`/assessment/${assessmentId}`} className="btn btn--primary btn--sm">🧠 Start Assessment →</Link>;

  return <button className="btn btn--primary btn--sm" onClick={generate} disabled={loading}>{loading ? 'Generating...' : '🧠 Generate Assessment'}</button>;
}
