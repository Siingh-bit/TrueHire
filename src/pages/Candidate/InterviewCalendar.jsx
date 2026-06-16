import { useState, useEffect } from 'react';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function InterviewCalendar() {
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    Promise.all([
      api.request('/api/interviews/my').catch(() => ({ data: [] })),
      api.getMyApplications().catch(() => ({ data: [] }))
    ]).then(([intRes, appRes]) => {
      setInterviews(intRes.data || []);
      const eligibleJobs = (appRes.data || []).filter(a => ['shortlisted', 'interview', 'assessment_completed'].includes(a.status));
      setJobs(eligibleJobs);
    }).finally(() => setLoading(false));
  }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!selectedJob || !date || !time) return alert('Please fill all fields');
    
    const datetime = new Date(`${date}T${time}`).toISOString();
    
    try {
      const res = await api.request('/api/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify({ job_id: selectedJob, scheduled_at: datetime })
      });
      if (res.success) {
        alert('Interview scheduled!');
        window.location.reload();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Failed to schedule');
    }
  };

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Switchera <span>Interview Validation</span> 📅</h1>
        <p className="dashboard__subtitle">Schedule your Switchera validation interview. A human interviewer will meet you to validate your skills.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        <div className="card">
          <h2>Schedule a Slot</h2>
          <form onSubmit={handleSchedule} className="form" style={{ marginTop: 'var(--space-4)' }}>
            <div className="form-group">
              <label>Select Job</label>
              <select className="form-control" value={selectedJob} onChange={e => setSelectedJob(e.target.value)} required>
                <option value="">-- Choose Job --</option>
                {jobs.map(j => <option key={j.job_id} value={j.job_id}>{j.job_title} at {j.company_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" className="form-control" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>Confirm Time Slot</button>
          </form>
        </div>

        <div className="card">
          <h2>My Scheduled Interviews</h2>
          <div style={{ marginTop: 'var(--space-4)' }}>
            {interviews.length === 0 ? <p>No interviews scheduled.</p> : interviews.map(i => (
              <div key={i.id} style={{ padding: 'var(--space-3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                <strong>{i.job_title}</strong> at {i.company_name}<br/>
                <span style={{ color: 'var(--color-text-secondary)' }}>{new Date(i.scheduled_at).toLocaleString()}</span><br/>
                Status: <span className="badge badge--primary">{i.status}</span>
                {i.video_url && <div style={{ marginTop: '8px' }}><a href={i.video_url} target="_blank" rel="noreferrer" className="btn btn--sm btn--secondary">View Recording</a></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
