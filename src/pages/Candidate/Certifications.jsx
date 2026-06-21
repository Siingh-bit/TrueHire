import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function Certifications() {
  const [skills, setSkills] = useState([]);
  const [myCerts, setMyCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.request('/certifications/available').catch(() => ({ data: [] })),
      api.request('/certifications/my').catch(() => ({ data: [] }))
    ]).then(([avail, mine]) => {
      setSkills(avail.data || []);
      setMyCerts(mine.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const handleTakeCertification = async (skill) => {
    setGenerating(true);
    try {
      const res = await api.request('/certifications/generate', {
        method: 'POST',
        body: JSON.stringify({ skill })
      });
      if (res.success) {
        navigate(`/assessment/${res.data.id}`);
      } else {
        showToast(res.message);
      }
    } catch (err) {
      showToast('Failed to generate certification test');
    }
    setGenerating(false);
  };

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Switchera <span>Certifications</span> 🏅</h1>
        <p className="dashboard__subtitle">Take industry-standard assessments to earn your Switchera Certifications.</p>
      </div>

      {toast.message && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div className="grid gap-4">
        {skills.map(skill => {
          const cert = myCerts.find(c => c.skill_name === skill);
          const isCertified = cert?.is_certified === 1;

          return (
            <div key={skill} className="cert-card">
              <div className="cert-card__info">
                <div className="cert-card__name">{skill}</div>
                {isCertified ? (
                  <span className="badge badge--success">✅ Switchera Certified ({cert.score}%)</span>
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
