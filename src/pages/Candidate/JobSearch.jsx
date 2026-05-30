import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ job_type: '', location: '', sort: 'newest' });

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = { search, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.getJobs(params);
      setJobs(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadJobs(); }, [filters]);

  const handleSearch = (e) => { e.preventDefault(); loadJobs(); };

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Find Your <span>Perfect Role</span></h1>
        <p className="dashboard__subtitle">Browse verified job opportunities from trusted employers</p>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input className="search-input" placeholder="Search jobs by title, skill, or company..." value={search} onChange={e => setSearch(e.target.value)} />
        <button type="submit" className="btn btn--primary">🔍 Search</button>
      </form>

      <div className="filters-bar">
        <select className="filter-select" value={filters.job_type} onChange={e => setFilters({...filters, job_type: e.target.value})}>
          <option value="">All Types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="remote">Remote</option>
        </select>
        <input className="filter-select" placeholder="📍 Location" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})} style={{ minWidth: '150px' }} />
        <select className="filter-select" value={filters.sort} onChange={e => setFilters({...filters, sort: e.target.value})}>
          <option value="newest">Newest First</option>
          <option value="salary_high">Salary: High to Low</option>
          <option value="salary_low">Salary: Low to High</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>{jobs.length} jobs found</span>
      </div>

      {loading ? (
        <div className="job-cards">{[1,2,3].map(i => <div key={i} className="card skeleton" style={{ height: '140px' }} />)}</div>
      ) : jobs.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state__icon">🔍</div><div className="empty-state__title">No jobs found</div><div className="empty-state__desc">Try adjusting your search or filters</div></div></div>
      ) : (
        <div className="job-cards">
          {jobs.map(job => (
            <Link key={job.id} to={`/candidate/jobs/${job.id}`} className="job-card">
              <div className="job-card__header">
                <div>
                  <div className="job-card__title">{job.title}</div>
                  <div className="job-card__company">{job.company_name} {job.company_verified ? '✅' : ''}</div>
                </div>
                <span className={`badge badge--${job.job_type === 'remote' ? 'accent' : 'primary'}`}>{job.job_type}</span>
              </div>
              <div className="job-card__meta">
                <span className="job-card__meta-item">📍 {job.location}</span>
                <span className="job-card__meta-item">💰 ₹{(job.salary_min/100000).toFixed(0)}L - ₹{(job.salary_max/100000).toFixed(0)}L/yr</span>
                <span className="job-card__meta-item">📅 {job.min_experience_years}-{job.max_experience_years || '15'}yr exp</span>
              </div>
              <div className="job-card__skills">
                {job.required_skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
              </div>
              <div className="job-card__footer">
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  {job.requires_assessment ? '🧠 AI Assessment Required' : '📋 No Assessment'}
                </span>
                <span className="btn btn--primary btn--sm">View Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
