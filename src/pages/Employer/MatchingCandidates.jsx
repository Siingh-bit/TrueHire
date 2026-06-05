import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';

export default function MatchingCandidates() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, candRes] = await Promise.all([
          api.getJob(jobId),
          api.getMatchingCandidates(jobId)
        ]);
        if (jobRes.success) setJob(jobRes.data);
        if (candRes.success) setCandidates(candRes.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchData();
  }, [jobId]);

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;
  if (!job) return <div className="dashboard">Job not found</div>;

  return (
    <div className="dashboard">
      <div className="dashboard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Link to="/employer/jobs" style={{ color: 'var(--color-primary-400)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '8px' }}>&larr; Back to Jobs</Link>
          <h1 className="dashboard__title">Matching Candidates</h1>
          <p className="dashboard__subtitle">AI-scored matches for <strong>{job.title}</strong> based on skills and joining availability.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {candidates.map(cand => (
          <div key={cand.id} className="dashboard__card" style={{ display: 'flex', gap: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 16px', background: 'var(--gradient-primary)', color: '#fff', fontWeight: 700, borderBottomLeftRadius: '12px' }}>
              {cand.matchScore}% Match
            </div>
            
            <img 
              src={cand.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.full_name)}&background=random`} 
              alt={cand.full_name} 
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
            />
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)', margin: 0 }}>{cand.full_name}</h3>
                {cand.verification_status === 'verified' && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(0,217,148,0.15)', color: '#00d994', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Verified Profile</span>
                )}
              </div>
              
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: '0 0 12px 0' }}>
                {cand.headline} • {cand.total_experience_years}y Experience
              </p>

              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Skill Match</div>
                  <div style={{ color: 'var(--color-primary-400)', fontWeight: 600 }}>{cand.skillOverlap} / {cand.totalRequiredSkills} Required Skills</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Available To Join</div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{cand.available_to_switch_from ? new Date(cand.available_to_switch_from).toLocaleDateString() : 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Notice Period</div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{cand.notice_period_days || 0} days</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '6px' }}>Skills</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(cand.skill_list || '').split(',').filter(Boolean).map(s => (
                    <span key={s} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <button style={{ padding: '8px 16px', background: 'var(--gradient-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Invite to Apply
              </button>
            </div>
          </div>
        ))}

        {candidates.length === 0 && (
          <div className="dashboard__card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No matching candidates found for this job's criteria yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
