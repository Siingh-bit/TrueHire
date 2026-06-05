import { useState, useEffect } from 'react';
import api from '../../api/client';
import './Admin.css';

export default function Pipeline() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, pId: null, level: 1, action: '', notes: '', date: '' });

  const loadPipelines = async () => {
    try {
      const res = await api.getAllPipelines();
      if (res.success) setPipelines(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadPipelines(); }, []);

  const handleAction = async () => {
    try {
      if (modal.action === 'send_employer') {
        await api.sendToEmployer(modal.pId);
      } else {
        const payload = { status: modal.action, notes: modal.notes, scheduled_at: modal.date || undefined };
        if (modal.level === 1) await api.updateLevel1(modal.pId, payload);
        if (modal.level === 2) await api.updateLevel2(modal.pId, payload);
      }
      setModal({ show: false, pId: null, level: 1, action: '', notes: '', date: '' });
      loadPipelines();
    } catch (err) { alert(err.message); }
  };

  const getStatusBadge = (status) => {
    if (!status) return '-';
    let cls = 'pending';
    if (status === 'cleared' || status === 'joined') cls = 'cleared';
    if (status === 'rejected') cls = 'rejected';
    if (status === 'scheduled' || status === 'interested') cls = 'scheduled';
    return <span className={`admin__badge admin__badge--${cls}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="admin">
      <div className="admin__header">
        <h1 className="admin__title">Interview Pipeline Control</h1>
        <p className="admin__subtitle">Manage candidates progressing through Level 1 & Level 2 platform interviews.</p>
      </div>

      <div className="admin__card">
        {loading ? <p style={{color:'var(--color-text-secondary)'}}>Loading pipelines...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job / Company</th>
                  <th>L1 Status</th>
                  <th>L2 Status</th>
                  <th>Employer Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pipelines.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{p.headline}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--color-primary-400)' }}>{p.job_title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{p.company_name}</div>
                    </td>
                    <td>
                      {getStatusBadge(p.level1_status)}
                      {p.level1_scheduled_at && <div style={{fontSize:'0.75rem', color:'var(--color-text-tertiary)', marginTop:'4px'}}>{new Date(p.level1_scheduled_at).toLocaleString()}</div>}
                    </td>
                    <td>
                      {getStatusBadge(p.level2_status)}
                      {p.level2_scheduled_at && <div style={{fontSize:'0.75rem', color:'var(--color-text-tertiary)', marginTop:'4px'}}>{new Date(p.level2_scheduled_at).toLocaleString()}</div>}
                    </td>
                    <td>
                      {p.sent_to_employer ? getStatusBadge(p.employer_status) : <span style={{color:'var(--color-text-tertiary)'}}>Not Sent</span>}
                    </td>
                    <td>
                      <div className="admin__actions">
                        {p.level1_status === 'pending' && <button className="admin__btn admin__btn--primary" onClick={() => setModal({ show: true, pId: p.id, level: 1, action: 'scheduled', notes: '', date: '' })}>Sch L1</button>}
                        {p.level1_status === 'scheduled' && (
                          <>
                            <button className="admin__btn admin__btn--success" onClick={() => setModal({ show: true, pId: p.id, level: 1, action: 'cleared', notes: '', date: '' })}>Pass L1</button>
                            <button className="admin__btn admin__btn--danger" onClick={() => setModal({ show: true, pId: p.id, level: 1, action: 'rejected', notes: '', date: '' })}>Fail L1</button>
                          </>
                        )}
                        {p.level1_status === 'cleared' && p.level2_status === 'pending' && <button className="admin__btn admin__btn--primary" onClick={() => setModal({ show: true, pId: p.id, level: 2, action: 'scheduled', notes: '', date: '' })}>Sch L2</button>}
                        {p.level2_status === 'scheduled' && (
                          <>
                            <button className="admin__btn admin__btn--success" onClick={() => setModal({ show: true, pId: p.id, level: 2, action: 'cleared', notes: '', date: '' })}>Pass L2</button>
                            <button className="admin__btn admin__btn--danger" onClick={() => setModal({ show: true, pId: p.id, level: 2, action: 'rejected', notes: '', date: '' })}>Fail L2</button>
                          </>
                        )}
                        {p.level1_status === 'cleared' && p.level2_status === 'cleared' && !p.sent_to_employer && (
                          <button className="admin__btn" style={{background:'var(--gradient-primary)', color:'#fff'}} onClick={() => setModal({ show: true, pId: p.id, level: 0, action: 'send_employer', notes: '', date: '' })}>Send to Employer</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pipelines.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', color:'var(--color-text-secondary)', padding:'24px'}}>No active pipelines.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.show && (
        <div className="admin__modal-overlay">
          <div className="admin__modal">
            <h3 className="admin__modal-title">
              {modal.action === 'send_employer' ? 'Send Profile to Employer' : `${modal.action.toUpperCase()} Level ${modal.level}`}
            </h3>
            {modal.action === 'scheduled' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Schedule Date/Time</label>
                <input type="datetime-local" value={modal.date} onChange={e => setModal({ ...modal, date: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)' }} />
              </div>
            )}
            {modal.action !== 'send_employer' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Interviewer Notes</label>
                <textarea
                  value={modal.notes} onChange={e => setModal({ ...modal, notes: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', minHeight: '100px', resize: 'vertical' }}
                  placeholder="Feedback, scores, or scheduling links..."
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="admin__btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={() => setModal({ show: false, pId: null, level: 1, action: '', notes: '', date: '' })}>Cancel</button>
              <button className="admin__btn admin__btn--primary" onClick={handleAction}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
