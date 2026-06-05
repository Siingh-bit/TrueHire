import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function ManageJobs() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = () => {
    if (profile?.id) api.getJobs({ employer_id: profile.id, limit: 100 }).then(res => setJobs(res.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { loadJobs(); }, [profile]);

  const toggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    await api.updateJob(job.id, { status: newStatus });
    loadJobs();
  };

  const closeJob = async (job) => {
    if (confirm('Close this job? It will no longer accept applications.')) {
      await api.updateJob(job.id, { status: 'closed' });
      loadJobs();
    }
  };

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  const statusBadge = { active: 'accent', paused: 'warning', closed: 'neutral' };

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="dashboard__welcome">Manage <span>Jobs</span></h1><p className="dashboard__subtitle">View and manage all your job postings</p></div>
        <Link to="/employer/post-job" className="btn btn--primary">+ Post New Job</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state__icon">📝</div><div className="empty-state__title">No jobs posted yet</div><Link to="/employer/post-job" className="btn btn--primary">Post Your First Job</Link></div></div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead><tr><th>Job Title</th><th>Status</th><th>Applicants</th><th>Type</th><th>Posted</th><th>Actions</th></tr></thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td><div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{job.title}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{job.location}</div></td>
                  <td><span className={`badge badge--${statusBadge[job.status]}`}>{job.status}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary-400)' }}>{job.application_count || 0}</td>
                  <td><span className="badge badge--primary">{job.job_type}</span></td>
                  <td>{new Date(job.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link to={`/employer/jobs/${job.id}/matching`} className="btn btn--secondary btn--sm" style={{ background: 'rgba(0,217,148,0.15)', color: '#00d994', borderColor: 'rgba(0,217,148,0.3)' }}>AI Matches</Link>
                      <Link to={`/employer/jobs/${job.id}/applicants`} className="btn btn--primary btn--sm">View Applicants</Link>
                      {job.status !== 'closed' && <button className="btn btn--secondary btn--sm" onClick={() => toggleStatus(job)}>{job.status === 'active' ? 'Pause' : 'Resume'}</button>}
                      {job.status !== 'closed' && <button className="btn btn--danger btn--sm" onClick={() => closeJob(job)}>Close</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
