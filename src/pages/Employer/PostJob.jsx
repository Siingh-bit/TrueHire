import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';

const COMMON_SKILLS = ['JavaScript','Python','Java','React','Node.js','SQL','AWS','Docker','Kubernetes','TypeScript','Machine Learning','Data Analysis','Spring Boot','Microservices','CI/CD','Terraform','NLP','TensorFlow','PyTorch','CSS','HTML','MongoDB','PostgreSQL','Redis','Kafka','GraphQL','REST APIs','Agile','Git','Product Management','Statistics','Power BI','Tableau','Excel','R','Spark','Hadoop'];

export default function PostJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', required_skills: [], preferred_skills: [], min_experience_years: 3, max_experience_years: 10, salary_min: '', salary_max: '', bounty_amount: '', location: '', job_type: 'full-time', requires_assessment: true, assessment_config: { difficulty: 'medium', duration: 45 }, application_deadline: '', expected_joining_date: '' });
  const [skillInput, setSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const addSkill = (skill, field) => {
    if (skill && !formData[field].includes(skill)) {
      update(field, [...formData[field], skill]);
    }
    if (field === 'required_skills') setSkillInput('');
    else setPrefSkillInput('');
    setSuggestions([]);
  };

  const removeSkill = (skill, field) => update(field, formData[field].filter(s => s !== skill));

  const handleSkillInput = (val, field) => {
    if (field === 'required_skills') setSkillInput(val);
    else setPrefSkillInput(val);
    if (val.length > 0) {
      setSuggestions(COMMON_SKILLS.filter(s => s.toLowerCase().includes(val.toLowerCase()) && !formData[field].includes(s)).slice(0, 6));
    } else setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.required_skills.length === 0) { setError('Add at least one required skill'); return; }
    setLoading(true); setError('');
    try {
      await api.createJob({ ...formData, salary_min: Number(formData.salary_min), salary_max: Number(formData.salary_max), bounty_amount: Number(formData.bounty_amount) });
      navigate('/employer/jobs');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Post a <span>New Job</span></h1>
        <p className="dashboard__subtitle">Create a job posting and find verified talent</p>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      <div className="card" style={{ padding: 'var(--space-8)', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field"><label>Job Title *</label><input required value={formData.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Senior Data Analyst" /></div>
          <div className="auth-field"><label>Job Description *</label><textarea rows={6} required value={formData.description} onChange={e => update('description', e.target.value)} placeholder="Describe the role, responsibilities, and requirements..." style={{ resize: 'vertical' }} /></div>

          <div className="auth-row">
            <div className="auth-field"><label>Job Type *</label><select value={formData.job_type} onChange={e => update('job_type', e.target.value)}><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="remote">Remote</option></select></div>
            <div className="auth-field"><label>Location *</label><input required value={formData.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Bangalore, India" /></div>
          </div>

          <div className="auth-row">
            <div className="auth-field"><label>Salary Min (₹/year)</label><input type="number" value={formData.salary_min} onChange={e => update('salary_min', e.target.value)} placeholder="e.g. 1500000" /></div>
            <div className="auth-field"><label>Salary Max (₹/year)</label><input type="number" value={formData.salary_max} onChange={e => update('salary_max', e.target.value)} placeholder="e.g. 2500000" /></div>
          </div>

          <div className="auth-field"><label>Crowdsourced Bounty (₹) - Optional</label><input type="number" value={formData.bounty_amount} onChange={e => update('bounty_amount', e.target.value)} placeholder="Reward for successful referral (e.g. 25000)" /></div>

          <div className="auth-row">
            <div className="auth-field"><label>Min Experience (years)</label><input type="number" min="3" value={formData.min_experience_years} onChange={e => update('min_experience_years', Number(e.target.value))} /></div>
            <div className="auth-field"><label>Max Experience (years)</label><input type="number" value={formData.max_experience_years} onChange={e => update('max_experience_years', Number(e.target.value))} /></div>
          </div>

          {/* Required Skills */}
          <div className="auth-field" style={{ position: 'relative' }}>
            <label>Required Skills *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {formData.required_skills.map(s => (
                <span key={s} className="skill-tag" style={{ cursor: 'pointer' }} onClick={() => removeSkill(s, 'required_skills')}>{s} ×</span>
              ))}
            </div>
            <input value={skillInput} onChange={e => handleSkillInput(e.target.value, 'required_skills')} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput, 'required_skills'); }}} placeholder="Type a skill and press Enter" />
            {suggestions.length > 0 && skillInput && (
              <div style={{ position: 'absolute', bottom: '-4px', left: 0, right: 0, transform: 'translateY(100%)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)', zIndex: 10, maxHeight: '200px', overflow: 'auto' }}>
                {suggestions.map(s => <div key={s} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} onClick={() => addSkill(s, 'required_skills')} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.target.style.background = 'none'}>{s}</div>)}
              </div>
            )}
          </div>

          {/* Preferred Skills */}
          <div className="auth-field">
            <label>Preferred Skills</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {formData.preferred_skills.map(s => (
                <span key={s} className="badge badge--neutral" style={{ cursor: 'pointer' }} onClick={() => removeSkill(s, 'preferred_skills')}>{s} ×</span>
              ))}
            </div>
            <input value={prefSkillInput} onChange={e => handleSkillInput(e.target.value, 'preferred_skills')} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(prefSkillInput, 'preferred_skills'); }}} placeholder="Type preferred skills" />
          </div>

          {/* Assessment */}
          <div style={{ padding: 'var(--space-4)', background: 'rgba(45,121,242,0.05)', border: '1px solid rgba(45,121,242,0.15)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <label style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>🧠 Require AI Assessment</label>
              <button type="button" className={`btn btn--sm ${formData.requires_assessment ? 'btn--primary' : 'btn--secondary'}`} onClick={() => update('requires_assessment', !formData.requires_assessment)}>
                {formData.requires_assessment ? 'Enabled ✓' : 'Disabled'}
              </button>
            </div>
            {formData.requires_assessment && (
              <div className="auth-row">
                <div className="auth-field"><label>Difficulty</label><select value={formData.assessment_config.difficulty} onChange={e => update('assessment_config', {...formData.assessment_config, difficulty: e.target.value})}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
                <div className="auth-field"><label>Duration (min)</label><select value={formData.assessment_config.duration} onChange={e => update('assessment_config', {...formData.assessment_config, duration: Number(e.target.value)})}><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></div>
              </div>
            )}
          </div>

          <div className="auth-row">
            <div className="auth-field"><label>Application Deadline</label><input type="date" value={formData.application_deadline} onChange={e => update('application_deadline', e.target.value)} /></div>
            <div className="auth-field"><label>Expected Joining Date</label><input type="date" value={formData.expected_joining_date} onChange={e => update('expected_joining_date', e.target.value)} placeholder="Ideal date for candidate to join" /></div>
          </div>

          <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>{loading ? 'Posting...' : 'Post Job →'}</button>
        </form>
      </div>
    </div>
  );
}
