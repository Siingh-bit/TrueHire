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
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    Promise.all([
      api.request('/interviews/my').catch(() => ({ data: [] })),
      api.getMyApplications().catch(() => ({ data: [] }))
    ]).then(([intRes, appRes]) => {
      setInterviews(intRes.data || []);
      const eligibleJobs = (appRes.data || []).filter(a => ['shortlisted', 'interview', 'assessment_completed'].includes(a.status));
      setJobs(eligibleJobs);
    }).finally(() => setLoading(false));
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!selectedJob || !date || !time) {
      showToast('Please fill all fields', 'error');
      return;
    }
    
    const datetime = new Date(`${date}T${time}`).toISOString();
    
    try {
      const res = await api.request('/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify({ job_id: selectedJob, scheduled_at: datetime })
      });
      if (res.success) {
        showToast('Interview scheduled successfully!');
        window.location.reload();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      console.error('Schedule error:', err);
      showToast(err.message || 'Failed to schedule interview', 'error');
    }
  };

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Switchera <span>Interview Validation</span> 📅</h1>
        <p className="dashboard__subtitle">Schedule your Switchera validation interview. A human interviewer will meet you to validate your skills.</p>
      </div>

      {toast.message && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div className="page-grid-2">
        <div className="card">
          <h2 className="card__header">📋 Schedule a Slot</h2>
          <form onSubmit={handleSchedule}>
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
            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }}>Confirm Time Slot</button>
          </form>
        </div>

        <div className="card">
          <h2 className="card__header">📅 My Scheduled Interviews</h2>
          {interviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <div className="empty-state__title">No interviews scheduled</div>
              <div className="empty-state__desc">Schedule your first validation interview using the form</div>
            </div>
          ) : interviews.map(i => (
            <div key={i.id} className="interview-item">
              <div className="interview-item__title">{i.job_title} at {i.company_name}</div>
              <div className="interview-item__meta">{new Date(i.scheduled_at).toLocaleString()}</div>
              <div className="interview-item__footer">
                <span className="badge badge--primary">{i.status}</span>
                {i.video_url && <a href={i.video_url} target="_blank" rel="noreferrer" className="btn btn--sm btn--secondary">View Recording</a>}
                <Link to={`/interview/live/${i.id}`} className="btn btn--primary btn--sm">🔴 Join Live Room</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
