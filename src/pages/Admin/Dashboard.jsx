import { useState, useEffect } from 'react';
import api from '../../api/client';
import './Admin.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminDashboard().then(res => {
      if (res.success) setData(res.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) return <div className="admin"><p style={{color:'var(--color-text-secondary)'}}>Loading dashboard...</p></div>;
  if (!data) return <div className="admin"><p style={{color:'var(--color-text-secondary)'}}>Failed to load data</p></div>;

  return (
    <div className="admin">
      <div className="admin__header">
        <h1 className="admin__title">Admin Dashboard</h1>
        <p className="admin__subtitle">Overview of platform metrics and recent activities</p>
      </div>

      <div className="admin__card" style={{ marginBottom: '2rem' }}>
        <h3 className="admin__card-title">Business KPIs</h3>
        <div className="admin__stats">
          <div className="admin__stat-card">
            <div className="admin__stat-value" style={{ color: '#8b5cf6' }}>{data.totalVisitors}</div>
            <div className="admin__stat-label">🌐 Total Visitors</div>
          </div>
          <div className="admin__stat-card">
            <div className="admin__stat-value" style={{ color: '#10b981' }}>{data.totalDownloads}</div>
            <div className="admin__stat-label">📱 App Downloads</div>
          </div>
          <div className="admin__stat-card">
            <div className="admin__stat-value">{data.totalCandidates}</div>
            <div className="admin__stat-label">👥 Total Candidates</div>
          </div>
          <div className="admin__stat-card">
            <div className="admin__stat-value">{data.totalEmployers}</div>
            <div className="admin__stat-label">🏢 Total Employers</div>
          </div>
          <div className="admin__stat-card">
            <div className="admin__stat-value">{data.totalJobs}</div>
            <div className="admin__stat-label">💼 Total Jobs Posted</div>
          </div>
          <div className="admin__stat-card" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
            <div className="admin__stat-value" style={{ color: '#10b981' }}>{data.candidatesHired}</div>
            <div className="admin__stat-label">🎉 Candidates Hired</div>
          </div>
          <div className="admin__stat-card" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
            <div className="admin__stat-value" style={{ color: '#10b981' }}>{data.employersHired}</div>
            <div className="admin__stat-label">🤝 Successful Employers</div>
          </div>
        </div>
      </div>

      <div className="admin__card" style={{ marginBottom: '2rem' }}>
        <h3 className="admin__card-title">Platform Health</h3>
        <div className="admin__stats">
          <div className="admin__stat-card">
            <div className="admin__stat-value">{data.activePipelines}</div>
            <div className="admin__stat-label">Active Pipelines</div>
          </div>
          <div className="admin__stat-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="admin__stat-value" style={{ color: '#ef4444' }}>{data.bannedAccounts}</div>
            <div className="admin__stat-label">Banned Accounts</div>
          </div>
          <div className="admin__stat-card" style={{ borderColor: 'rgba(234,179,8,0.3)' }}>
            <div className="admin__stat-value" style={{ color: '#eab308' }}>{data.agreementsPending}</div>
            <div className="admin__stat-label">Pending Agreements</div>
          </div>
        </div>
      </div>

      <div className="admin__card">
        <h3 className="admin__card-title">Recent Admin Actions</h3>
        {data.recentActions?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Candidate</th>
                  <th>Reason/Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActions.map(action => (
                  <tr key={action.id}>
                    <td>{new Date(action.created_at).toLocaleString()}</td>
                    <td>{action.admin_email}</td>
                    <td><span className="admin__badge" style={{background:'rgba(255,255,255,0.1)'}}>{action.action_type.replace('_', ' ')}</span></td>
                    <td>{action.candidate_name || 'N/A'}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {action.reason || action.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{color:'var(--color-text-secondary)', fontSize:'0.9rem'}}>No recent actions recorded.</p>
        )}
      </div>
    </div>
  );
}
