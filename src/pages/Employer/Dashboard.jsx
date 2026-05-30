import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function EmployerDashboard() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      api.getJobs({ employer_id: profile.id, limit: 50 }).then(res => setJobs(res.data || [])).finally(() => setLoading(false));
    }
  }, [profile]);

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  const activeJobs = jobs.filter(j => j.status === 'active');
  const totalApps = jobs.reduce((sum, j) => sum + (j.application_count || 0), 0);

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Welcome, <span>{profile?.company_name}</span> 🏢</h1>
        <p className="dashboard__subtitle">Manage your job postings and review verified candidates</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-card__label">Active Jobs</div><div className="stat-card__value stat-card__value--primary">{activeJobs.length}</div></div>
        <div className="stat-card"><div className="stat-card__label">Total Applications</div><div className="stat-card__value stat-card__value--accent">{totalApps}</div></div>
        <div className="stat-card"><div className="stat-card__label">Total Jobs Posted</div><div className="stat-card__value stat-card__value--secondary">{jobs.length}</div></div>
        <div className="stat-card"><div className="stat-card__label">Company Status</div><div className="stat-card__value stat-card__value--accent">{profile?.is_verified ? '✅ Verified' : '⏳ Pending'}</div></div>
      </div>

      <div className="quick-actions">
        <Link to="/employer/post-job" className="btn btn--primary btn--lg">+ Post New Job</Link>
        <Link to="/employer/jobs" className="btn btn--secondary">📋 Manage Jobs</Link>
      </div>

      <div className="section-header">
        <h2 className="section-title">Your Active Jobs</h2>
        <Link to="/employer/jobs" className="section-link">View All →</Link>
      </div>

      {activeJobs.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state__icon">📝</div><div className="empty-state__title">No active jobs</div><div className="empty-state__desc">Post your first job to start receiving applications</div><Link to="/employer/post-job" className="btn btn--primary">Post a Job</Link></div></div>
      ) : (
        <div className="job-cards">
          {activeJobs.map(job => (
            <Link key={job.id} to={`/employer/jobs/${job.id}/applicants`} className="job-card">
              <div className="job-card__header">
                <div>
                  <div className="job-card__title">{job.title}</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>{job.location} · {job.job_type}</div>
                </div>
                <span className="badge badge--accent">{job.application_count || 0} applicants</span>
              </div>
              <div className="job-card__skills">
                {job.required_skills?.slice(0, 5).map(s => <span key={s} className="skill-tag">{s}</span>)}
              </div>
              <div className="job-card__footer">
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                <span className="btn btn--secondary btn--sm">View Applicants →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
