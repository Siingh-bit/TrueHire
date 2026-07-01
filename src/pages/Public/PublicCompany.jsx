import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function PublicCompany() {
  const { id } = useParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getJobs({ employer_id: id }).then(res => setJobs(res.data || [])).catch(() => setJobs([])).finally(() => setLoading(false));
  }, [id]);

  const company = jobs[0];

  useEffect(() => {
    if (company) document.title = `${company.company_name} — jobs & careers | Switchera`;
    return () => { document.title = 'Switchera — Verified Job Portal | Find Jobs & Hire Verified Talent'; };
  }, [company]);

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  if (!company) return (
    <div className="dashboard"><div className="empty-state">
      <div className="empty-state__icon">🏢</div>
      <div className="empty-state__title">No open roles</div>
      <p className="empty-state__desc">This company has no active listings right now.</p>
      <Link to="/jobs" className="btn btn--primary">Browse all jobs</Link>
    </div></div>
  );

  const salaryOf = (j) => (j.salary_min || j.salary_max)
    ? `₹${((j.salary_min || 0) / 100000).toFixed(0)}L - ₹${((j.salary_max || 0) / 100000).toFixed(0)}L`
    : 'Not disclosed';

  return (
    <div className="dashboard animate-fade-in-up">
      <Link to="/jobs" className="btn btn--secondary btn--sm" style={{ marginBottom: 'var(--space-4)' }}>← All jobs</Link>

      <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
        {company.company_logo_url
          ? <img src={company.company_logo_url} alt={company.company_name} style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', objectFit: 'contain', background: '#fff', padding: 4 }} />
          : <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#fff' }}>{company.company_name?.[0]}</div>}
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '4px' }}>{company.company_name} {company.company_verified ? '✅' : ''}</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{company.industry} · {jobs.length} open role{jobs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Open roles</h2>
      <div className="job-cards">
        {jobs.map(j => (
          <Link key={j.id} to={`/jobs/${j.id}`} className="job-card">
            <div className="job-card__header">
              <div>
                <div className="job-card__title">{j.title}</div>
                <div className="job-card__company">{j.location}</div>
              </div>
              <span className="badge badge--primary">{j.job_type}</span>
            </div>
            <div className="job-card__meta">
              <span className="job-card__meta-item">💰 {salaryOf(j)}</span>
              <span className="job-card__meta-item">📅 {j.min_experience_years}-{j.max_experience_years || '15'}yr</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
