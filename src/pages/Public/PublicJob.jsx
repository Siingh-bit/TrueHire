import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import ShareButton from '../../components/ShareButton';
import '../../styles/dashboard.css';

export default function PublicJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getJob(id).then(res => setJob(res.data)).catch(() => setJob(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (job) document.title = `${job.title}${job.company_name ? ' at ' + job.company_name : ''} | Switchera`;
    return () => { document.title = 'Switchera — Verified Job Portal | Find Jobs & Hire Verified Talent'; };
  }, [job]);

  const handleApply = () => {
    if (isAuthenticated && user?.role === 'candidate') navigate(`/candidate/jobs/${id}`);
    else navigate('/login');
  };

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;
  if (!job) return (
    <div className="dashboard"><div className="empty-state">
      <div className="empty-state__icon">🔍</div>
      <div className="empty-state__title">Job not found</div>
      <p className="empty-state__desc">This job may have been closed or removed.</p>
      <Link to="/jobs" className="btn btn--primary">Browse all jobs</Link>
    </div></div>
  );

  const shareUrl = `${window.location.origin}/jobs/${job.id}`;
  const salary = (job.salary_min || job.salary_max)
    ? `₹${((job.salary_min || 0) / 100000).toFixed(0)}L - ₹${((job.salary_max || 0) / 100000).toFixed(0)}L`
    : 'Not disclosed';

  return (
    <div className="dashboard animate-fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <Link to="/jobs" className="btn btn--secondary btn--sm">← All jobs</Link>
        <ShareButton url={shareUrl} title={`${job.title} at ${job.company_name}`} text={`${job.title} at ${job.company_name} — apply on Switchera`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div>
          <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>{job.title}</h1>
            <div style={{ color: 'var(--color-primary-400)', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>
              {job.company_name} {job.company_verified ? '✅' : ''}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
              <span className="badge badge--primary">💼 {job.job_type}</span>
              <span className="badge badge--accent">📍 {job.location}</span>
              <span className="badge badge--secondary">💰 {salary}</span>
              <span className="badge badge--warning">📅 {job.min_experience_years}-{job.max_experience_years || '15'}yr</span>
            </div>

            <h3 style={{ marginBottom: 'var(--space-3)' }}>Job Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, marginBottom: 'var(--space-6)' }}>{job.description}</p>

            {job.required_skills?.length > 0 && (<>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Required Skills</h3>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
                {job.required_skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
              </div>
            </>)}

            {job.preferred_skills?.length > 0 && (<>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Preferred Skills</h3>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
                {job.preferred_skills.map(s => <span key={s} className="badge badge--neutral">{s}</span>)}
              </div>
            </>)}
          </div>

          <button className="btn btn--primary btn--lg" style={{ width: '100%' }} onClick={handleApply}>
            {isAuthenticated && user?.role === 'candidate' ? 'Apply for this Position →' : 'Sign in to Apply →'}
          </button>
        </div>

        <div>
          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>About {job.company_name}</h3>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              {job.industry && <p><strong>Industry:</strong> {job.industry}</p>}
              {job.company_size && <p><strong>Size:</strong> {job.company_size} employees</p>}
              {job.headquarters && <p><strong>HQ:</strong> {job.headquarters}</p>}
              {job.company_description && <p style={{ marginTop: '8px' }}>{job.company_description.substring(0, 160)}...</p>}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Share this job</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Know someone who'd be a great fit? Send it their way.
            </p>
            <ShareButton url={shareUrl} title={`${job.title} at ${job.company_name}`} text={`${job.title} at ${job.company_name} — apply on Switchera`} className="btn btn--primary" label="Share this job" />
          </div>
        </div>
      </div>
    </div>
  );
}
