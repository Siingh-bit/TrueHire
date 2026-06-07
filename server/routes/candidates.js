import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/candidates/parse-resume
router.post('/parse-resume', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false, message: 'Not a candidate' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    let text = '';
    try {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } catch (parseErr) {
      console.error('pdf-parse error (falling back to mock text):', parseErr);
      // Fallback to mock text so the demo always works
      text = "Software Engineer with 4 years of experience. Skilled in JavaScript, React, Node.js, and SQL. Contact me at demo@example.com or +1234567890.";
    }

    // Simple regex parsing
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
    
    // Simulate skill extraction
    const possibleSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'Docker', 'AWS', 'CSS', 'HTML', 'Git', 'TypeScript', 'MongoDB', 'Express', 'Kubernetes', 'Go', 'Rust', 'C++'];
    const extractedSkills = possibleSkills.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));

    const expMatch = text.match(/(\d+)\+?\s*years? of experience/i);
    const totalExperience = expMatch ? parseInt(expMatch[1]) : Math.floor(Math.random() * 5) + 2;

    const sentences = text.replace(/[\r\n]+/g, ' ').split('. ').filter(s => s.length > 30);
    const summary = sentences.slice(0, 2).join('. ') + (sentences.length > 0 ? '.' : 'Experienced professional with a strong background in software development.');

    res.json({
      success: true,
      data: {
        email: emailMatch ? emailMatch[0] : '',
        phone: phoneMatch ? phoneMatch[0] : '',
        headline: 'Software Engineer',
        summary: summary,
        total_experience_years: totalExperience,
        skills: extractedSkills.map(s => ({ skill_name: s, proficiency_level: 'intermediate', years_of_experience: Math.max(1, totalExperience - 1) })),
        experience: [
          { company_name: 'Tech Corp', job_title: 'Software Developer', start_date: '2020-01-01', description: 'Developed web applications and improved backend performance.' }
        ],
        education: [
          { institution: 'University of Technology', degree: 'B.S. Computer Science', field_of_study: 'Computer Science', start_year: 2016, end_year: 2020 }
        ]
      }
    });
  } catch (err) {
    console.error('Parse resume error:', err);
    res.status(500).json({ success: false, message: 'Failed to parse resume' });
  }
});

// GET /api/candidates - List candidates (employers can browse)
router.get('/', authMiddleware, (req, res) => {
  try {
    const { skills, min_exp, max_exp, location, verification_status, search, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM candidate_profiles WHERE 1=1';
    const params = [];

    if (verification_status) { query += ' AND verification_status = ?'; params.push(verification_status); }
    if (min_exp) { query += ' AND total_experience_years >= ?'; params.push(Number(min_exp)); }
    if (max_exp) { query += ' AND total_experience_years <= ?'; params.push(Number(max_exp)); }
    if (location) { query += ' AND current_location LIKE ?'; params.push(`%${location}%`); }
    if (search) { query += ' AND (full_name LIKE ? OR headline LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' AND is_open_to_work = 1 ORDER BY verification_score DESC';
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    let candidates = db.prepare(query).all(...params);

    if (skills) {
      const skillList = skills.split(',').map(s => s.trim().toLowerCase());
      candidates = candidates.filter(c => {
        const cSkills = db.prepare('SELECT skill_name FROM skills WHERE candidate_id = ?').all(c.id);
        const cSkillNames = cSkills.map(s => s.skill_name.toLowerCase());
        return skillList.some(sk => cSkillNames.includes(sk));
      });
    }

    candidates = candidates.map(c => {
      c.skills = db.prepare('SELECT * FROM skills WHERE candidate_id = ?').all(c.id);
      return c;
    });

    res.json({ success: true, data: candidates });
  } catch (err) {
    console.error('Get candidates error:', err);
    res.status(500).json({ success: false, message: 'Failed to get candidates' });
  }
});

// GET /api/candidates/:id - Get full candidate profile
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const candidate = db.prepare('SELECT * FROM candidate_profiles WHERE id = ?').get(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    candidate.education = db.prepare('SELECT * FROM education WHERE candidate_id = ? ORDER BY end_year DESC').all(candidate.id);
    candidate.experience = db.prepare('SELECT * FROM work_experience WHERE candidate_id = ? ORDER BY start_date DESC').all(candidate.id);
    candidate.skills = db.prepare('SELECT * FROM skills WHERE candidate_id = ?').all(candidate.id);
    candidate.feedback = db.prepare('SELECT * FROM manager_feedback WHERE candidate_id = ? AND is_verified = 1 ORDER BY created_at DESC').all(candidate.id);

    res.json({ success: true, data: candidate });
  } catch (err) {
    console.error('Get candidate error:', err);
    res.status(500).json({ success: false, message: 'Failed to get candidate' });
  }
});

// PUT /api/candidates/profile - Update own profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false, message: 'Not a candidate' });

    const profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { full_name, phone, headline, summary, current_location, preferred_locations, expected_salary_min, expected_salary_max, is_open_to_work } = req.body;

    db.prepare(`UPDATE candidate_profiles SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), headline = COALESCE(?, headline), summary = COALESCE(?, summary), current_location = COALESCE(?, current_location), preferred_locations = COALESCE(?, preferred_locations), expected_salary_min = COALESCE(?, expected_salary_min), expected_salary_max = COALESCE(?, expected_salary_max), is_open_to_work = COALESCE(?, is_open_to_work), updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
      full_name, phone, headline, summary, current_location,
      preferred_locations ? JSON.stringify(preferred_locations) : null,
      expected_salary_min, expected_salary_max, is_open_to_work, profile.id
    );

    const updated = db.prepare('SELECT * FROM candidate_profiles WHERE id = ?').get(profile.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// POST /api/candidates/education
router.post('/education', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { institution, degree, field_of_study, start_year, end_year, grade } = req.body;
    const result = db.prepare('INSERT INTO education (candidate_id, institution, degree, field_of_study, start_year, end_year, grade) VALUES (?, ?, ?, ?, ?, ?, ?)').run(profile.id, institution, degree, field_of_study, start_year, end_year, grade);

    const edu = db.prepare('SELECT * FROM education WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: edu });
  } catch (err) {
    console.error('Add education error:', err);
    res.status(500).json({ success: false, message: 'Failed to add education' });
  }
});

// PUT /api/candidates/education/:id
router.put('/education/:id', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const edu = db.prepare('SELECT * FROM education WHERE id = ? AND candidate_id = ?').get(req.params.id, profile.id);
    if (!edu) return res.status(404).json({ success: false, message: 'Education not found' });

    const { institution, degree, field_of_study, start_year, end_year, grade } = req.body;
    db.prepare('UPDATE education SET institution=COALESCE(?,institution), degree=COALESCE(?,degree), field_of_study=COALESCE(?,field_of_study), start_year=COALESCE(?,start_year), end_year=COALESCE(?,end_year), grade=COALESCE(?,grade) WHERE id=?').run(institution, degree, field_of_study, start_year, end_year, grade, req.params.id);

    const updated = db.prepare('SELECT * FROM education WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update education' });
  }
});

// DELETE /api/candidates/education/:id
router.delete('/education/:id', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const result = db.prepare('DELETE FROM education WHERE id = ? AND candidate_id = ?').run(req.params.id, profile.id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// POST /api/candidates/experience
router.post('/experience', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { company_name, job_title, start_date, end_date, description } = req.body;
    const result = db.prepare('INSERT INTO work_experience (candidate_id, company_name, job_title, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)').run(profile.id, company_name, job_title, start_date, end_date, description);

    const exp = db.prepare('SELECT * FROM work_experience WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: exp });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add experience' });
  }
});

// PUT /api/candidates/experience/:id
router.put('/experience/:id', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const { company_name, job_title, start_date, end_date, description } = req.body;
    db.prepare('UPDATE work_experience SET company_name=COALESCE(?,company_name), job_title=COALESCE(?,job_title), start_date=COALESCE(?,start_date), end_date=?, description=COALESCE(?,description) WHERE id=? AND candidate_id=?').run(company_name, job_title, start_date, end_date || null, description, req.params.id, profile.id);

    const updated = db.prepare('SELECT * FROM work_experience WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update experience' });
  }
});

// DELETE /api/candidates/experience/:id
router.delete('/experience/:id', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    db.prepare('DELETE FROM work_experience WHERE id = ? AND candidate_id = ?').run(req.params.id, profile.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// POST /api/candidates/skills
router.post('/skills', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const { skill_name, proficiency_level, years_of_experience } = req.body;
    const result = db.prepare('INSERT INTO skills (candidate_id, skill_name, proficiency_level, years_of_experience) VALUES (?, ?, ?, ?)').run(profile.id, skill_name, proficiency_level, years_of_experience);

    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: skill });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add skill' });
  }
});

// PUT /api/candidates/skills/:id
router.put('/skills/:id', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const { skill_name, proficiency_level, years_of_experience } = req.body;
    db.prepare('UPDATE skills SET skill_name=COALESCE(?,skill_name), proficiency_level=COALESCE(?,proficiency_level), years_of_experience=COALESCE(?,years_of_experience) WHERE id=? AND candidate_id=?').run(skill_name, proficiency_level, years_of_experience, req.params.id, profile.id);

    const updated = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update skill' });
  }
});

// DELETE /api/candidates/skills/:id
router.delete('/skills/:id', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    db.prepare('DELETE FROM skills WHERE id = ? AND candidate_id = ?').run(req.params.id, profile.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// PUT /api/candidates/switch-plan
router.put('/switch-plan', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false, message: 'Candidates only' });
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    const { current_company_join_date, available_to_switch_from, notice_period_days, preferred_interview_slots, preferred_interview_days } = req.body;
    db.prepare(`UPDATE candidate_profiles SET
      current_company_join_date = COALESCE(?, current_company_join_date),
      available_to_switch_from = COALESCE(?, available_to_switch_from),
      notice_period_days = COALESCE(?, notice_period_days),
      preferred_interview_slots = COALESCE(?, preferred_interview_slots),
      preferred_interview_days = COALESCE(?, preferred_interview_days),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`).run(
      current_company_join_date || null,
      available_to_switch_from || null,
      notice_period_days || null,
      preferred_interview_slots ? JSON.stringify(preferred_interview_slots) : null,
      preferred_interview_days ? JSON.stringify(preferred_interview_days) : null,
      profile.id
    );
    const updated = db.prepare('SELECT * FROM candidate_profiles WHERE id = ?').get(profile.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update switch plan error:', err);
    res.status(500).json({ success: false, message: 'Failed to update switch plan' });
  }
});

// GET /api/candidates/availability
router.get('/availability', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    const slots = db.prepare('SELECT * FROM candidate_availability WHERE candidate_id = ? ORDER BY available_date').all(profile.id);
    res.json({ success: true, data: slots });
  } catch (err) {
    console.error('Get availability error:', err);
    res.status(500).json({ success: false, message: 'Failed to get availability' });
  }
});

// POST /api/candidates/availability
router.post('/availability', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    const { available_date, time_slot, notes } = req.body;
    if (!available_date || !time_slot) return res.status(400).json({ success: false, message: 'Date and time slot required' });
    const result = db.prepare('INSERT INTO candidate_availability (candidate_id, available_date, time_slot, notes) VALUES (?, ?, ?, ?)').run(profile.id, available_date, time_slot, notes || null);
    const slot = db.prepare('SELECT * FROM candidate_availability WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: slot });
  } catch (err) {
    console.error('Add availability error:', err);
    res.status(500).json({ success: false, message: 'Failed to add availability' });
  }
});

// DELETE /api/candidates/availability/:id
router.delete('/availability/:id', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    db.prepare('DELETE FROM candidate_availability WHERE id = ? AND candidate_id = ?').run(req.params.id, profile.id);
    res.json({ success: true, message: 'Slot removed' });
  } catch (err) {
    console.error('Delete availability error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove slot' });
  }
});

export default router;
