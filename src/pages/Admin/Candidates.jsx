import { useState, useEffect } from 'react';
import api from '../../api/client';
import './Admin.css';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', account_status: '', agreement: '' });
  const [modal, setModal] = useState({ show: false, candidateId: null, type: '', notes: '' });

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCandidates(filters);
      if (res.success) setCandidates(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadCandidates(); }, [filters.account_status, filters.agreement]);

  const handleAction = async () => {
    try {
      if (modal.type === 'ban') {
        await api.updateAccountStatus(modal.candidateId, 'perm_banned', modal.notes);
      } else if (modal.type === 'warn') {
        await api.updateAccountStatus(modal.candidateId, 'warned', modal.notes);
      } else if (modal.type === 'unban') {
        await api.updateAccountStatus(modal.candidateId, 'active', modal.notes);
      } else if (modal.type === 'flag') {
        await api.updateCheatingFlag(modal.candidateId, true, modal.notes);
      } else if (modal.type === 'unflag') {
        await api.updateCheatingFlag(modal.candidateId, false, modal.notes);
      }
      setModal({ show: false, candidateId: null, type: '', notes: '' });
      loadCandidates();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="admin">
      <div className="admin__header">
        <h1 className="admin__title">Manage Candidates</h1>
        <p className="admin__subtitle">Monitor profiles, enforce policies, and manage account statuses.</p>
      </div>

      <div className="admin__filters">
        <input type="text" placeholder="Search name or email..." className="admin__filter-input"
          value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && loadCandidates()} />
        <select className="admin__filter-input" value={filters.account_status} onChange={e => setFilters({ ...filters, account_status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="warned">Warned</option>
          <option value="temp_banned">Temp Banned</option>
          <option value="perm_banned">Perm Banned</option>
        </select>
        <select className="admin__filter-input" value={filters.agreement} onChange={e => setFilters({ ...filters, agreement: e.target.value })}>
          <option value="">All Agreements</option>
          <option value="accepted">Accepted</option>
          <option value="pending">Pending</option>
        </select>
        <button className="admin__btn admin__btn--primary" onClick={loadCandidates}>Search</button>
      </div>

      <div className="admin__card">
        {loading ? <p style={{color:'var(--color-text-secondary)'}}>Loading candidates...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Name & Email</th>
                  <th>Exp</th>
                  <th>Agreement</th>
                  <th>Status</th>
                  <th>Cheating Flag</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{c.email}</div>
                    </td>
                    <td>{c.total_experience_years}y</td>
                    <td>
                      <span className={`admin__badge ${c.agreement_accepted ? 'admin__badge--active' : 'admin__badge--warned'}`}>
                        {c.agreement_accepted ? `Accepted (v${c.agreement_version})` : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin__badge admin__badge--${c.account_status === 'active' ? 'active' : c.account_status.includes('banned') ? 'banned' : 'warned'}`}>
                        {c.account_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {c.cheating_flag ? <span className="admin__badge admin__badge--banned">Flagged</span> : <span style={{color:'var(--color-text-tertiary)'}}>-</span>}
                    </td>
                    <td>
                      <div className="admin__actions">
                        {c.account_status.includes('banned') ? (
                          <button className="admin__btn admin__btn--success" onClick={() => setModal({ show: true, candidateId: c.id, type: 'unban', notes: '' })}>Unban</button>
                        ) : (
                          <>
                            <button className="admin__btn admin__btn--warning" onClick={() => setModal({ show: true, candidateId: c.id, type: 'warn', notes: '' })}>Warn</button>
                            <button className="admin__btn admin__btn--danger" onClick={() => setModal({ show: true, candidateId: c.id, type: 'ban', notes: '' })}>Ban</button>
                          </>
                        )}
                        {c.cheating_flag ? (
                          <button className="admin__btn" style={{background:'rgba(255,255,255,0.1)'}} onClick={() => setModal({ show: true, candidateId: c.id, type: 'unflag', notes: '' })}>Remove Flag</button>
                        ) : (
                          <button className="admin__btn admin__btn--danger" onClick={() => setModal({ show: true, candidateId: c.id, type: 'flag', notes: '' })}>Flag Cheat</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign:'center', color:'var(--color-text-secondary)', padding:'24px'}}>No candidates found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.show && (
        <div className="admin__modal-overlay">
          <div className="admin__modal">
            <h3 className="admin__modal-title">Confirm Action: {modal.type.toUpperCase()}</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Reason / Notes</label>
              <textarea
                value={modal.notes} onChange={e => setModal({ ...modal, notes: e.target.value })}
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', minHeight: '100px', resize: 'vertical' }}
                placeholder="Enter detailed reason for this action..."
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="admin__btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={() => setModal({ show: false, candidateId: null, type: '', notes: '' })}>Cancel</button>
              <button className={`admin__btn ${modal.type === 'ban' || modal.type === 'flag' ? 'admin__btn--danger' : modal.type === 'warn' ? 'admin__btn--warning' : 'admin__btn--success'}`} onClick={handleAction}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
