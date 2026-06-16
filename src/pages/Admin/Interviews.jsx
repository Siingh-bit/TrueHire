import { useState, useEffect } from 'react';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.request('/api/interviews/all')
      .then(res => setInterviews(res.data || []))
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (id, video_url, feedback_notes, status) => {
    try {
      const res = await api.request(`/api/interviews/${id}/recording`, {
        method: 'PUT',
        body: JSON.stringify({ video_url, feedback_notes, status })
      });
      if (res.success) {
        alert('Saved successfully');
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Failed to save');
    }
  };

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Switchera <span>Interview Validation</span> 📹</h1>
        <p className="dashboard__subtitle">Manage candidate interviews and upload recordings for employer validation.</p>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '12px' }}>Candidate</th>
              <th style={{ padding: '12px' }}>Job</th>
              <th style={{ padding: '12px' }}>Scheduled At</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Video URL</th>
              <th style={{ padding: '12px' }}>Feedback Notes</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px' }}>{i.candidate_name}</td>
                <td style={{ padding: '12px' }}>{i.job_title}<br/><small style={{color:'var(--color-text-secondary)'}}>{i.company_name}</small></td>
                <td style={{ padding: '12px' }}>{new Date(i.scheduled_at).toLocaleString()}</td>
                <td style={{ padding: '12px' }}>
                  <select defaultValue={i.status} id={`status-${i.id}`} className="form-control" style={{ minWidth: '120px' }}>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td style={{ padding: '12px' }}>
                  <input type="url" defaultValue={i.video_url} id={`video-${i.id}`} className="form-control" placeholder="https://" />
                </td>
                <td style={{ padding: '12px' }}>
                  <input type="text" defaultValue={i.feedback_notes} id={`notes-${i.id}`} className="form-control" placeholder="Interviewer notes..." />
                </td>
                <td style={{ padding: '12px' }}>
                  <button className="btn btn--primary btn--sm" onClick={() => {
                    handleSave(
                      i.id, 
                      document.getElementById(`video-${i.id}`).value,
                      document.getElementById(`notes-${i.id}`).value,
                      document.getElementById(`status-${i.id}`).value
                    );
                  }}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {interviews.length === 0 && <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>No interviews scheduled.</div>}
      </div>
    </div>
  );
}
