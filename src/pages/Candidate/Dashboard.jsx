import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import '../../styles/dashboard.css';

const STATUS_COLORS = { applied: 'primary', screening: 'secondary', assessment_pending: 'warning', assessment_completed: 'accent', shortlisted: 'success', interview: 'secondary', offered: 'success', hired: 'accent', rejected: 'danger' };

export default function CandidateDashboard() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMyApplications().catch(() => ({ data: [] })),
      api.getJobs({ limit: 6 }).catch(() => ({ data: [] })),
    ]).then(([appRes, jobRes]) => {
      setApplications(appRes.data || []);
      setJobs(jobRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  const completeness = profile?.profile_completeness || 0;
  const verStatus = profile?.verification_status || 'pending';

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Welcome back, <span>{profile?.full_name?.split(' ')[0]}</span> 👋</h1>
        <p className="dashboard__subtitle">Here's your Switchera dashboard overview</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__label">Profile Completeness</div>
          <div className="stat-card__value stat-card__value--primary">{completeness}%</div>
          <div className="score-bar mt-2">
            <div className={`score-bar__fill score-bar__fill--${completeness > 70 ? 'high' : 'medium'}`} style={{ width: `${completeness}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Verification</div>
          <div className={`stat-card__value ${verStatus === 'verified' ? 'stat-card__value--accent' : 'stat-card__value--warning'}`}>
            {verStatus === 'verified' ? '✅ Verified' : verStatus === 'in_progress' ? '🔄 In Progress' : '⏳ Pending'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Applications</div>
          <div className="stat-card__value stat-card__value--secondary">{applications.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Interviews</div>
          <div className="stat-card__value stat-card__value--accent">{applications.filter(a => a.status === 'interview' || a.status === 'offered').length}</div>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/candidate/jobs" className="btn btn--primary">🔍 Search Jobs</Link>
        <Link to="/candidate/certifications" className="btn btn--secondary">🏅 Get Certified</Link>
        <Link to="/candidate/interviews" className="btn btn--secondary">📅 Schedule Validation</Link>
        <Link to="/candidate/profile" className="btn btn--secondary">✏️ Edit Profile</Link>
        <Link to="/candidate/applications" className="btn btn--secondary">📋 My Applications</Link>
      </div>

      {/* Recent Applications */}
      <div className="page-section">
        <div className="section-header">
          <h2 className="section-title">Recent Applications</h2>
          <Link to="/candidate/applications" className="section-link">View All →</Link>
        </div>
        {applications.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state__icon">📝</div><div className="empty-state__title">No applications yet</div><div className="empty-state__desc">Start by searching for jobs that match your skills</div><Link to="/candidate/jobs" className="btn btn--primary">Browse Jobs</Link></div></div>
        ) : (
          <div className="job-cards">
            {applications.slice(0, 5).map(app => (
              <div key={app.id} className="job-card" style={{ cursor: 'default' }}>
                <div className="job-card__header">
                  <div>
                    <div className="job-card__title">{app.job_title}</div>
                    <div className="job-card__company">{app.company_name}</div>
                  </div>
                  <span className={`badge badge--${STATUS_COLORS[app.status]}`}>{app.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="job-card__meta">
                  <span className="job-card__meta-item">📍 {app.job_location}</span>
                  <span className="job-card__meta-item">💼 {app.job_type}</span>
                  {app.assessment_score && <span className="job-card__meta-item">📊 Score: {app.assessment_score}%</span>}
                </div>
                {app.status === 'assessment_pending' && app.assessment?.id && (
                  <Link to={`/assessment/${app.assessment.id}`} className="btn btn--primary btn--sm">Take Assessment →</Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Jobs */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Recommended Jobs</h2>
          <Link to="/candidate/jobs" className="section-link">View All →</Link>
        </div>
        <div className="job-cards grid grid-3 gap-4">
          {jobs.slice(0, 6).map(job => (
            <Link key={job.id} to={`/candidate/jobs/${job.id}`} className="job-card">
              <div className="job-card__title">{job.title}</div>
              <div className="job-card__company">{job.company_name}</div>
              <div className="job-card__meta mt-2">
                <span className="job-card__meta-item">📍 {job.location}</span>
                <span className="job-card__meta-item">💰 ₹{(job.salary_min/100000).toFixed(0)}L - ₹{(job.salary_max/100000).toFixed(0)}L</span>
              </div>
              <div className="job-card__skills mt-2">
                {job.required_skills?.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
