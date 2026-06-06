import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function Certifications() {
  const [skills, setSkills] = useState([]);
  const [myCerts, setMyCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.request('/api/certifications/available').catch(() => ({ data: [] })),
      api.request('/api/certifications/my').catch(() => ({ data: [] }))
    ]).then(([avail, mine]) => {
      setSkills(avail.data || []);
      setMyCerts(mine.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleTakeCertification = async (skill) => {
    setGenerating(true);
    try {
      const res = await api.request('/api/certifications/generate', {
        method: 'POST',
        body: JSON.stringify({ skill })
      });
      if (res.success) {
        navigate(`/assessment/${res.data.id}`);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Failed to generate certification test');
    }
    setGenerating(false);
  };

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">TrueHire <span>Certifications</span> 🏅</h1>
        <p className="dashboard__subtitle">Pass a rigorous skill assessment to bypass job-specific tests</p>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        {skills.map(skill => {
          const cert = myCerts.find(c => c.skill_name === skill);
          const isCertified = cert?.is_certified === 1;

          return (
            <div key={skill} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>{skill}</h3>
                {isCertified ? (
                  <span className="badge badge--success" style={{ fontSize: '1rem', padding: '6px 12px' }}>✅ TrueHire Certified ({cert.score}%)</span>
                ) : cert ? (
                  <span className="badge badge--danger">Failed ({cert.score}%)</span>
                ) : (
                  <span className="badge badge--warning">Not Certified</span>
                )}
              </div>
              <div>
                {!isCertified && (
                  <button 
                    className="btn btn--primary" 
                    onClick={() => handleTakeCertification(skill)}
                    disabled={generating}
                  >
                    Take Certification Test
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
