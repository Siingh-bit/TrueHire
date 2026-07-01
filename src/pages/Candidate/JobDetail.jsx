import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [message, setMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    api.getJob(id).then(res => setJob(res.data)).catch(() => navigate('/candidate/jobs')).finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const referrer_id = urlParams.get('referrer') ? Number(urlParams.get('referrer')) : null;

      await api.applyForJob(job.id, coverLetter, videoUrl, referrer_id);
      setMessage('Application submitted successfully!');
      setShowApply(false);
      // Refresh job data
      const res = await api.getJob(id);
      setJob(res.data);
    } catch (err) { setMessage('Error: ' + err.message); }
    finally { setApplying(false); }
  };

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;
  if (!job) return null;

  return (
    <div className="dashboard animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="btn btn--secondary btn--sm" style={{ marginBottom: 'var(--space-4)' }}>← Back</button>

      {message && <div style={{ padding: 'var(--space-3) var(--space-4)', background: message.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(232, 181, 63,0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', color: message.startsWith('Error') ? 'var(--color-danger-400)' : 'var(--color-accent-400)', fontSize: 'var(--font-size-sm)' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Main */}
        <div>
          <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>{job.title}</h1>
            <div style={{ color: 'var(--color-primary-400)', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>{job.company_name} {job.company_verified ? '✅' : ''}</div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
              <span className="badge badge--primary">💼 {job.job_type}</span>
              <span className="badge badge--accent">📍 {job.location}</span>
              <span className="badge badge--secondary">💰 ₹{(job.salary_min/100000).toFixed(0)}L - ₹{(job.salary_max/100000).toFixed(0)}L</span>
              <span className="badge badge--warning">📅 {job.min_experience_years}-{job.max_experience_years || '15'}yr</span>
            </div>

            <h3 style={{ marginBottom: 'var(--space-3)' }}>Job Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, marginBottom: 'var(--space-6)' }}>{job.description}</p>

            <h3 style={{ marginBottom: 'var(--space-3)' }}>Required Skills</h3>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
              {job.required_skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
            </div>

            {job.preferred_skills?.length > 0 && (<>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Preferred Skills</h3>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
                {job.preferred_skills.map(s => <span key={s} className="badge badge--neutral">{s}</span>)}
              </div>
            </>)}

            {job.requires_assessment && (
              <div style={{ padding: 'var(--space-4)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-warning-400)' }}>🧠 AI Assessment Required</div>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>This job requires completing an AI-generated skill assessment with proctoring (face detection & tab monitoring).</p>
              </div>
            )}
          </div>

          {/* Apply Section */}
          {!job.has_applied && !showApply && (
            <button className="btn btn--primary btn--lg" style={{ width: '100%' }} onClick={() => setShowApply(true)}>Apply for this Position →</button>
          )}

          {job.has_applied && (
            <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem' }}>✅</span>
              <h3 style={{ margin: 'var(--space-2) 0' }}>Already Applied</h3>
              <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>Status: <span className={`badge badge--primary`}>{job.application?.status?.replace(/_/g, ' ')}</span></p>
              <Link to="/candidate/applications" className="btn btn--secondary">View My Applications</Link>
            </div>
          )}

          {showApply && (
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Apply for {job.title}</h3>
              <div className="auth-field" style={{ marginBottom: 'var(--space-4)' }}>
                <label>Cover Letter (Optional)</label>
                <textarea rows={5} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Tell the employer why you're a great fit..." style={{ width: '100%', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', resize: 'vertical', outline: 'none' }} />
              </div>
              <div className="auth-field" style={{ marginBottom: 'var(--space-4)' }}>
                <label>Video Pitch (TikTok-style 60s intro)</label>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <input type="file" accept="video/mp4,video/webm" onChange={async (e) => {
                    const file = e.target.files[0];
                    if(!file) return;
                    if (file.size > 25 * 1024 * 1024) {
                      setMessage('Error: File is too large. Maximum size is 25MB.');
                      e.target.value = '';
                      return;
                    }
                    setUploadingVideo(true);
                    setMessage('');
                    const fd = new FormData(); fd.append('video', file);
                    try {
                      const res = await fetch('/api/applications/upload-video', { method: 'POST', headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}, body: fd});
                      const data = await res.json().catch(() => ({ success: false, message: 'Server returned an invalid response (might be too large).' }));
                      if(data.success) {
                        setVideoUrl(data.url);
                        setMessage('');
                      } else {
                        setMessage('Error: ' + data.message);
                      }
                    } catch(err) { setMessage('Error: Video upload failed. ' + err.message); }
                    finally { setUploadingVideo(false); }
                  }} className="btn btn--secondary" style={{ flex: 1 }} />
                  {uploadingVideo && <span style={{fontSize: 'var(--font-size-sm)'}}>Uploading...</span>}
                  {videoUrl && <span style={{color: 'var(--color-primary-400)'}}>✅ Uploaded</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn--secondary" onClick={() => setShowApply(false)}>Cancel</button>
                <button className="btn btn--primary" onClick={handleApply} disabled={applying || uploadingVideo}>{applying ? 'Submitting...' : 'Submit Application'}</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>About {job.company_name}</h3>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              <p><strong>Industry:</strong> {job.industry}</p>
              <p><strong>Size:</strong> {job.company_size} employees</p>
              <p><strong>HQ:</strong> {job.headquarters}</p>
              {job.website && <p><strong>Website:</strong> <a href={job.website} target="_blank" rel="noopener">{job.website}</a></p>}
              {job.company_description && <p style={{ marginTop: '8px' }}>{job.company_description.substring(0, 150)}...</p>}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Job Summary</h3>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <p>📋 {job.application_count} applications</p>
              <p>📅 Deadline: {job.application_deadline || 'Open'}</p>
              <p>📊 Assessment: {job.requires_assessment ? 'Required' : 'Not required'}</p>
            </div>
          </div>

          {job.bounty_amount > 0 && (
            <div className="card" style={{ padding: 'var(--space-6)', background: 'rgba(232, 181, 63, 0.05)', border: '1px solid rgba(232, 181, 63, 0.2)' }}>
              <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-accent-400)' }}>💰 Referral Bounty: ₹{job.bounty_amount}</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>Refer a friend. If they get hired, you earn the bounty!</p>
              <button className="btn btn--primary" style={{ width: '100%' }} onClick={() => {
                const url = new URL(window.location.href);
                // In a real app we'd get candidate's user ID from context, assuming profile.id or similar.
                // Let's parse jwt to get our user id safely, or just get it from local storage?
                // We'll just generate the link if we can't reliably get user_id here without auth context. 
                // Actually, let's just construct the link and ask them to copy.
                // But we don't have the user ID readily available in state without AuthContext.
                // Wait! We can import useAuth to get user id!
                navigator.clipboard.writeText(`${window.location.origin}/candidate/jobs/${job.id}?referrer=${JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id}`);
                setMessage('Referral link copied to clipboard!');
              }}>Generate & Copy Link</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
