import { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

const deslug = (s = '') => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function PublicJobs() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Work out which kind of page this is and the matching filter + copy.
  let mode = 'all', display = '';
  if (pathname.startsWith('/jobs/location/')) { mode = 'location'; display = deslug(slug); }
  else if (pathname.startsWith('/jobs/role/')) { mode = 'role'; display = deslug(slug); }
  else if (pathname.startsWith('/jobs/skill/')) { mode = 'skill'; display = deslug(slug); }

  const heading = mode === 'location' ? `Jobs in ${display}`
    : mode === 'role' ? `${display} jobs`
    : mode === 'skill' ? `${display} jobs`
    : 'Browse verified jobs';

  const subtitle = mode === 'all'
    ? 'Every role here is from a verified employer. Find your next opportunity on Switchera.'
    : `Verified ${mode === 'location' ? '' : display + ' '}openings${mode === 'location' ? ' in ' + display : ''} on Switchera — apply with your skills, not just a resume.`;

  useEffect(() => {
    setLoading(true);
    const filter = {};
    if (mode === 'location') filter.location = display;
    else if (mode === 'role') filter.search = display;
    else if (mode === 'skill') filter.skills = slug.replace(/-/g, ' ');
    api.getJobs(filter).then(res => setJobs(res.data || [])).catch(() => setJobs([])).finally(() => setLoading(false));
  }, [pathname, slug]);

  useEffect(() => {
    document.title = `${heading} | Switchera`;
    return () => { document.title = 'Switchera — Verified Job Portal | Find Jobs & Hire Verified Talent'; };
  }, [heading]);

  const runSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/jobs/role/${q.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const salaryOf = (j) => (j.salary_min || j.salary_max)
    ? `₹${((j.salary_min || 0) / 100000).toFixed(0)}L - ₹${((j.salary_max || 0) / 100000).toFixed(0)}L`
    : 'Not disclosed';

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">{heading}</h1>
        <p className="dashboard__subtitle">{subtitle}</p>
      </div>

      <form className="search-bar" onSubmit={runSearch}>
        <input className="search-input" placeholder="Search by role, e.g. Data Analyst" value={search} onChange={e => setSearch(e.target.value)} />
        <button type="submit" className="btn btn--primary">Search</button>
      </form>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📭</div>
          <div className="empty-state__title">No jobs found here yet</div>
          <p className="empty-state__desc">New roles are added often — check back soon.</p>
          <Link to="/jobs" className="btn btn--primary">Browse all jobs</Link>
        </div>
      ) : (
        <div className="job-cards">
          {jobs.map(j => (
            <Link key={j.id} to={`/jobs/${j.id}`} className="job-card">
              <div className="job-card__header">
                <div>
                  <div className="job-card__title">{j.title}</div>
                  <div className="job-card__company">{j.company_name} {j.company_verified ? '✅' : ''}</div>
                </div>
                <span className="badge badge--primary">{j.job_type}</span>
              </div>
              <div className="job-card__meta">
                <span className="job-card__meta-item">📍 {j.location}</span>
                <span className="job-card__meta-item">💰 {salaryOf(j)}</span>
                <span className="job-card__meta-item">📅 {j.min_experience_years}-{j.max_experience_years || '15'}yr</span>
              </div>
              {j.required_skills?.length > 0 && (
                <div className="job-card__skills">
                  {j.required_skills.slice(0, 6).map(s => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
