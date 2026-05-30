import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

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

export default router;
