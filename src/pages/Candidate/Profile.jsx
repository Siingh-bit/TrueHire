import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function CandidateProfile() {
  const { profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState(null); // { type: 'education'|'experience'|'skill', data: null|object }
  const [formData, setFormData] = useState({});
  const [parsingResume, setParsingResume] = useState(false);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setParsingResume(true);
    setMessage('Parsing resume... please wait.');
    try {
      const uploadData = new FormData();
      uploadData.append('resume', file);
      
      const data = await api.request('/candidates/parse-resume', {
        method: 'POST',
        body: uploadData
      });
      
      if (data.success) {
        const pd = data.data;
        
        // Update main profile fields
        const newProfileData = {
          ...candidate,
          full_name: pd.full_name || candidate.full_name || '',
          phone: pd.phone || candidate.phone || '',
          headline: pd.headline || candidate.headline || '',
          summary: pd.summary || candidate.summary || '',
          total_experience_years: pd.total_experience_years || candidate.total_experience_years || 0
        };
        await api.updateProfile(newProfileData);

        // Add parsed arrays
        if (pd.skills?.length) {
          for (const s of pd.skills) await api.addSkill(s).catch(e=>console.log(e));
        }
        if (pd.experience?.length) {
          for (const exp of pd.experience) await api.addExperience(exp).catch(e=>console.log(e));
        }
        if (pd.education?.length) {
          for (const edu of pd.education) await api.addEducation(edu).catch(e=>console.log(e));
        }

        await loadProfile();
        setFormData(newProfileData);
        setMessage('Resume parsed! Profile, skills, and experience have been auto-filled. Please review for accuracy.');
      } else {
        setMessage('Error: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error parsing resume: ' + (err.message || 'Unknown error'));
    } finally {
      setParsingResume(false);
      e.target.value = '';
    }
  };

  const loadProfile = async () => {
    try {
      if (profile?.id) {
        const res = await api.getCandidate(profile.id);
        setCandidate(res.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadProfile(); }, [profile]);

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(formData);
      await refreshProfile();
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === 'education') {
        if (modal.data?.id) await api.updateEducation(modal.data.id, formData);
        else await api.addEducation(formData);
      } else if (modal.type === 'experience') {
        if (modal.data?.id) await api.updateExperience(modal.data.id, formData);
        else await api.addExperience(formData);
      } else if (modal.type === 'skill') {
        if (modal.data?.id) await api.updateSkill(modal.data.id, formData);
        else await api.addSkill(formData);
      }
      setModal(null);
      loadProfile();
    } catch (err) { setMessage('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      if (type === 'education') await api.deleteEducation(id);
      else if (type === 'experience') await api.deleteExperience(id);
      else if (type === 'skill') await api.deleteSkill(id);
      loadProfile();
    } catch (err) { console.error(err); }
  };

  const openModal = (type, data = null) => {
    setFormData(data || {});
    setModal({ type, data });
  };

  useEffect(() => {
    if (candidate) {
      if (activeTab === 'personal') {
        setFormData({ full_name: candidate.full_name, phone: candidate.phone, headline: candidate.headline, summary: candidate.summary, current_location: candidate.current_location, expected_salary_min: candidate.expected_salary_min, expected_salary_max: candidate.expected_salary_max, is_open_to_work: candidate.is_open_to_work, work_preferences: candidate.work_preferences ? JSON.parse(candidate.work_preferences) : [] });
      } else if (activeTab === 'switch plan') {
        setFormData({
          current_company_join_date: candidate.current_company_join_date,
          available_to_switch_from: candidate.available_to_switch_from,
          notice_period_days: candidate.notice_period_days,
          preferred_interview_days: candidate.preferred_interview_days ? JSON.parse(candidate.preferred_interview_days) : []
        });
      }
    }
  }, [candidate, activeTab]);

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;

  const vStatusIcon = { verified: '✅', pending: '⏳', in_progress: '🔄', rejected: '❌' };

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">My Profile</h1>
        <p className="dashboard__subtitle">Manage your professional information</p>
      </div>

      {message && <div style={{ padding: 'var(--space-3) var(--space-4)', background: message.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(232, 181, 63,0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', color: message.startsWith('Error') ? 'var(--color-danger-400)' : 'var(--color-accent-400)', fontSize: 'var(--font-size-sm)' }}>{message}</div>}

      <div className="tabs">
        {['personal', 'switch plan', 'education', 'experience', 'skills'].map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'tab--active' : ''}`} onClick={() => setActiveTab(t)}>{t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</button>
        ))}
      </div>

      {activeTab === 'personal' && (
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Auto-Fill Profile</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>Upload your resume (PDF) to automatically extract details like your phone number and skills.</p>
            <input type="file" accept="application/pdf" onChange={handleResumeUpload} disabled={parsingResume} className="btn btn--secondary" style={{ width: '100%', cursor: parsingResume ? 'wait' : 'pointer' }} />
          </div>
          <form onSubmit={handleSavePersonal} className="auth-form">
            <div className="auth-row">
              <div className="auth-field"><label>Full Name</label><input type="text" value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
              <div className="auth-field"><label>Phone</label><input type="tel" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            </div>
            <div className="auth-field"><label>Professional Headline</label><input type="text" value={formData.headline || ''} onChange={e => setFormData({...formData, headline: e.target.value})} /></div>
            <div className="auth-field"><label>Summary</label><textarea rows={4} value={formData.summary || ''} onChange={e => setFormData({...formData, summary: e.target.value})} style={{ resize: 'vertical' }} /></div>
            <div className="auth-field">
              <label>What are you looking for? (select up to 2)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                {[{ value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' }, { value: 'internship', label: 'Internship' }, { value: 'freelance', label: 'Freelance' }, { value: 'contract', label: 'Contract' }].map(opt => {
                  const sel = (formData.work_preferences || []).includes(opt.value);
                  return (
                    <button type="button" key={opt.value} className={`btn ${sel ? 'btn--primary' : 'btn--secondary'}`} onClick={() => {
                      const cur = formData.work_preferences || [];
                      if (sel) setFormData({ ...formData, work_preferences: cur.filter(v => v !== opt.value) });
                      else if (cur.length < 2) setFormData({ ...formData, work_preferences: [...cur, opt.value] });
                      else { setMessage('You can select up to 2 options.'); setTimeout(() => setMessage(''), 2500); }
                    }}>{opt.label}</button>
                  );
                })}
              </div>
            </div>
            <div className="auth-row">
              <div className="auth-field"><label>Current Location</label><input type="text" value={formData.current_location || ''} onChange={e => setFormData({...formData, current_location: e.target.value})} /></div>
              <div className="auth-field"><label>Open to Work</label><select value={formData.is_open_to_work ? '1' : '0'} onChange={e => setFormData({...formData, is_open_to_work: e.target.value === '1' ? 1 : 0})}><option value="1">Yes</option><option value="0">No</option></select></div>
            </div>
            <div className="auth-row">
              <div className="auth-field"><label>Expected Salary Min (₹/year)</label><input type="number" value={formData.expected_salary_min || ''} onChange={e => setFormData({...formData, expected_salary_min: e.target.value})} /></div>
              <div className="auth-field"><label>Expected Salary Max (₹/year)</label><input type="number" value={formData.expected_salary_max || ''} onChange={e => setFormData({...formData, expected_salary_max: e.target.value})} /></div>
            </div>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      )}

      {activeTab === 'switch plan' && (
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(18, 168, 102,0.1)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-primary-400)' }}>Seamless Job Switch Planning</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Configure your availability to help Switchera schedule your Level 1 & Level 2 interviews smoothly around your current job, and set your expected joining date for potential employers.</p>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              await api.updateSwitchPlan({
                current_company_join_date: formData.current_company_join_date,
                available_to_switch_from: formData.available_to_switch_from,
                notice_period_days: formData.notice_period_days,
                preferred_interview_days: formData.preferred_interview_days ? formData.preferred_interview_days.split(',').map(s=>s.trim()) : [],
              });
              setMessage('Switch plan updated successfully!');
              setTimeout(() => setMessage(''), 3000);
            } catch (err) { setMessage('Error: ' + err.message); }
            setSaving(false);
          }} className="auth-form">
            <div className="auth-row">
              <div className="auth-field"><label>Current Company Join Date</label><input type="date" value={formData.current_company_join_date || ''} onChange={e => setFormData({...formData, current_company_join_date: e.target.value})} /></div>
              <div className="auth-field"><label>Notice Period (Days)</label><input type="number" value={formData.notice_period_days || 0} onChange={e => setFormData({...formData, notice_period_days: e.target.value})} /></div>
            </div>
            <div className="auth-row">
              <div className="auth-field"><label>Expected Availability to Join Date</label><input type="date" value={formData.available_to_switch_from || ''} onChange={e => setFormData({...formData, available_to_switch_from: e.target.value})} /></div>
              <div className="auth-field"><label>Preferred Interview Days</label><input type="text" placeholder="e.g. Sat, Sun" value={formData.preferred_interview_days ? (Array.isArray(formData.preferred_interview_days) ? formData.preferred_interview_days.join(', ') : formData.preferred_interview_days) : ''} onChange={e => setFormData({...formData, preferred_interview_days: e.target.value})} /></div>
            </div>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save Switch Plan'}</button>
          </form>
        </div>
      )}

      {activeTab === 'education' && (
        <div>
          <button className="btn btn--primary" style={{ marginBottom: 'var(--space-4)' }} onClick={() => openModal('education')}>+ Add Education</button>
          <div className="job-cards">
            {candidate?.education?.map(edu => (
              <div key={edu.id} className="card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', marginBottom: '4px' }}>{edu.degree} in {edu.field_of_study}</div>
                    <div style={{ color: 'var(--color-primary-400)', marginBottom: '4px' }}>{edu.institution}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>{edu.start_year} - {edu.end_year} · {edu.grade}</div>
                    <span className={`v-badge v-badge--${edu.verification_status}`}>{vStatusIcon[edu.verification_status]} {edu.verification_status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn--secondary btn--sm" onClick={() => openModal('education', edu)}>Edit</button>
                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete('education', edu.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'experience' && (
        <div>
          <button className="btn btn--primary" style={{ marginBottom: 'var(--space-4)' }} onClick={() => openModal('experience')}>+ Add Experience</button>
          <div className="job-cards">
            {candidate?.experience?.map(exp => (
              <div key={exp.id} className="card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', marginBottom: '4px' }}>{exp.job_title}</div>
                    <div style={{ color: 'var(--color-primary-400)', marginBottom: '4px' }}>{exp.company_name}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>{exp.start_date} - {exp.end_date || 'Present'}</div>
                    {exp.description && <p style={{ marginTop: '8px', fontSize: 'var(--font-size-sm)' }}>{exp.description}</p>}
                    <span className={`v-badge v-badge--${exp.verification_status}`}>{vStatusIcon[exp.verification_status]} {exp.verification_status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn--secondary btn--sm" onClick={() => openModal('experience', exp)}>Edit</button>
                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete('experience', exp.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div>
          <button className="btn btn--primary" style={{ marginBottom: 'var(--space-4)' }} onClick={() => openModal('skill')}>+ Add Skill</button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            {candidate?.skills?.map(skill => (
              <div key={skill.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: '250px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>{skill.skill_name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{skill.proficiency_level} · {skill.years_of_experience}yr</div>
                  {skill.is_verified ? <span className="v-badge v-badge--verified">✅ Verified</span> : <span className="v-badge v-badge--pending">⏳ Unverified</span>}
                  {skill.assessment_score && <span style={{ marginLeft: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-400)' }}>Score: {skill.assessment_score}%</span>}
                </div>
                <button className="btn btn--danger btn--sm" onClick={() => handleDelete('skill', skill.id)}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{modal.data ? 'Edit' : 'Add'} {modal.type}</h3>
              <button className="modal__close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSaveModal} className="auth-form">
              {modal.type === 'education' && (<>
                <div className="auth-field"><label>Institution *</label><input required value={formData.institution || ''} onChange={e => setFormData({...formData, institution: e.target.value})} /></div>
                <div className="auth-row"><div className="auth-field"><label>Degree *</label><input required value={formData.degree || ''} onChange={e => setFormData({...formData, degree: e.target.value})} /></div><div className="auth-field"><label>Field of Study</label><input value={formData.field_of_study || ''} onChange={e => setFormData({...formData, field_of_study: e.target.value})} /></div></div>
                <div className="auth-row"><div className="auth-field"><label>Start Year</label><input type="number" value={formData.start_year || ''} onChange={e => setFormData({...formData, start_year: e.target.value})} /></div><div className="auth-field"><label>End Year</label><input type="number" value={formData.end_year || ''} onChange={e => setFormData({...formData, end_year: e.target.value})} /></div></div>
                <div className="auth-field"><label>Grade/CGPA</label><input value={formData.grade || ''} onChange={e => setFormData({...formData, grade: e.target.value})} /></div>
              </>)}
              {modal.type === 'experience' && (<>
                <div className="auth-row"><div className="auth-field"><label>Company *</label><input required value={formData.company_name || ''} onChange={e => setFormData({...formData, company_name: e.target.value})} /></div><div className="auth-field"><label>Job Title *</label><input required value={formData.job_title || ''} onChange={e => setFormData({...formData, job_title: e.target.value})} /></div></div>
                <div className="auth-row"><div className="auth-field"><label>Start Date *</label><input type="date" required value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})} /></div><div className="auth-field"><label>End Date</label><input type="date" value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})} placeholder="Leave empty if current" /></div></div>
                <div className="auth-field"><label>Description</label><textarea rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              </>)}
              {modal.type === 'skill' && (<>
                <div className="auth-field">
                  <label>Skill Name *</label>
                  <input required list="skill-suggestions" value={formData.skill_name || ''} onChange={e => setFormData({...formData, skill_name: e.target.value})} placeholder="e.g. Python, React, SQL" />
                  <datalist id="skill-suggestions">
                    {['Excel', 'Advanced Excel', 'Microsoft Excel', 'Python', 'React', 'React Native', 'SQL', 'MySQL', 'PostgreSQL', 'JavaScript', 'TypeScript', 'Node.js', 'Machine Learning', 'Data Analysis', 'Data Science', 'Project Management', 'Java', 'C++', 'C#', '.NET', 'Communication', 'Leadership', 'Sales', 'Digital Marketing', 'SEO', 'HTML', 'CSS', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum', 'Figma', 'UI/UX Design', 'Tableau', 'Power BI', 'Financial Analysis', 'Accounting', 'Customer Service', 'Problem Solving'].filter(s => formData.skill_name && s.toLowerCase().includes(formData.skill_name.toLowerCase())).map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="auth-row"><div className="auth-field"><label>Proficiency</label><select value={formData.proficiency_level || 'intermediate'} onChange={e => setFormData({...formData, proficiency_level: e.target.value})}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div><div className="auth-field"><label>Years of Experience</label><input type="number" step="0.5" value={formData.years_of_experience || ''} onChange={e => setFormData({...formData, years_of_experience: e.target.value})} /></div></div>
              </>)}
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
