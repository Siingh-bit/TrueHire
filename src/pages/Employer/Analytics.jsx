import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import '../../styles/dashboard.css';

const COLORS = ['#2d79f2', '#00d994', '#ff9800', '#f44336', '#9c27b0'];

export default function EmployerAnalytics() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      api.getEmployerAnalytics()
        .then(res => setMetrics(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [profile]);

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;
  if (!metrics) return <div className="dashboard"><h2>Analytics failed to load.</h2></div>;

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Recruitment <span>Analytics</span> 📊</h1>
        <p className="dashboard__subtitle">Track your hiring pipeline and metrics</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__label">Active Jobs</div>
          <div className="stat-card__value stat-card__value--primary">{metrics.totalActiveJobs || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Applications</div>
          <div className="stat-card__value stat-card__value--accent">{metrics.funnel[0]?.value || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Avg Time-to-Hire</div>
          <div className="stat-card__value stat-card__value--secondary">{metrics.avgTimeToHireDays} days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Assessment Drop-off</div>
          <div className="stat-card__value stat-card__value--warning">{metrics.dropOffRate}%</div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="section-title">Hiring Funnel</h2>
      </div>

      <div className="card" style={{ padding: 'var(--space-5)', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics.funnel} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-primary)" />
            <XAxis type="number" stroke="var(--color-text-secondary)" />
            <YAxis dataKey="name" type="category" stroke="var(--color-text-secondary)" width={100} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)' }}
              cursor={{ fill: 'var(--color-bg-subtle)' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {metrics.funnel.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
