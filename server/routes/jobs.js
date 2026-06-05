import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/jobs - List jobs with filters
router.get('/', optionalAuth, (req, res) => {
  try {
    const { search, location, job_type, min_salary, max_salary, min_exp, skills, status = 'active', page = 1, limit = 20, sort = 'newest', employer_id } = req.query;
    let query = 'SELECT j.*, ep.company_name, ep.company_logo_url, ep.industry, ep.is_verified as company_verified FROM jobs j JOIN employer_profiles ep ON j.employer_id = ep.id WHERE 1=1';
    const params = [];

    if (employer_id) { query += ' AND j.employer_id = ?'; params.push(Number(employer_id)); }
    else { query += ' AND j.status = ?'; params.push(status); }

    if (search) { query += ' AND (j.title LIKE ? OR j.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (location) { query += ' AND j.location LIKE ?'; params.push(`%${location}%`); }
    if (job_type) { query += ' AND j.job_type = ?'; params.push(job_type); }
    if (min_salary) { query += ' AND j.salary_max >= ?'; params.push(Number(min_salary)); }
    if (max_salary) { query += ' AND j.salary_min <= ?'; params.push(Number(max_salary)); }
    if (min_exp) { query += ' AND j.min_experience_years <= ?'; params.push(Number(min_exp)); }

    if (sort === 'newest') query += ' ORDER BY j.created_at DESC';
    else if (sort === 'salary_high') query += ' ORDER BY j.salary_max DESC';
    else if (sort === 'salary_low') query += ' ORDER BY j.salary_min ASC';
    else query += ' ORDER BY j.created_at DESC';

    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    let jobs = db.prepare(query).all(...params);

    // Parse JSON fields
    jobs = jobs.map(j => ({
      ...j,
      required_skills: JSON.parse(j.required_skills || '[]'),
      preferred_skills: JSON.parse(j.preferred_skills || '[]'),
      assessment_config: j.assessment_config ? JSON.parse(j.assessment_config) : null,
    }));

    // Filter by skills if needed
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim().toLowerCase());
      jobs = jobs.filter(j => {
        const reqSkills = j.required_skills.map(s => s.toLowerCase());
        return skillList.some(sk => reqSkills.includes(sk));
      });
    }

    // Add application count for employer's own jobs
    if (req.user?.role === 'employer') {
      jobs = jobs.map(j => ({
        ...j,
        application_count: db.prepare('SELECT COUNT(*) as count FROM applications WHERE job_id = ?').get(j.id).count,
      }));
    }

    res.json({ success: true, data: jobs });
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to get jobs' });
  }
});
// GET /api/jobs/matching-candidates/:jobId
router.get('/matching-candidates/:jobId', authMiddleware, (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const requiredSkills = JSON.parse(job.required_skills || '[]');
    
    // Get all open candidates with their skills
    const candidates = db.prepare(`
      SELECT cp.*, u.email,
        GROUP_CONCAT(DISTINCT s.skill_name) as skill_list
      FROM candidate_profiles cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN skills s ON s.candidate_id = cp.id
      WHERE cp.is_open_to_work = 1
        AND cp.account_status = 'active'
        AND cp.total_experience_years >= ?
        AND (cp.total_experience_years <= ? OR ? IS NULL)
      GROUP BY cp.id
    `).all(job.min_experience_years || 0, job.max_experience_years || 99, job.max_experience_years);

    // Score each candidate
    const scored = candidates.map(c => {
      const candidateSkills = (c.skill_list || '').split(',').map(s => s.trim().toLowerCase());
      const skillOverlap = requiredSkills.filter(rs => candidateSkills.includes(rs.toLowerCase())).length;
      const skillScore = requiredSkills.length > 0 ? (skillOverlap / requiredSkills.length) * 50 : 25;

      let dateScore = 25; // default if no dates
      if (job.expected_joining_date && c.available_to_switch_from) {
        const jobDate = new Date(job.expected_joining_date);
        const candDate = new Date(c.available_to_switch_from);
        const diffDays = Math.abs((jobDate - candDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) dateScore = 50;
        else if (diffDays <= 60) dateScore = 40;
        else if (diffDays <= 90) dateScore = 30;
        else if (diffDays <= 180) dateScore = 15;
        else dateScore = 5;
      }

      const verificationBonus = c.verification_status === 'verified' ? 10 : 0;
      const matchScore = Math.min(100, Math.round(skillScore + dateScore + verificationBonus));

      return { ...c, matchScore, skillOverlap, totalRequiredSkills: requiredSkills.length };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ success: true, data: scored });
  } catch (err) {
    console.error('Matching candidates error:', err);
    res.status(500).json({ success: false, message: 'Failed to get matching candidates' });
  }
});

// GET /api/jobs/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const job = db.prepare('SELECT j.*, ep.company_name, ep.company_logo_url, ep.industry, ep.company_size, ep.website, ep.description as company_description, ep.headquarters, ep.is_verified as company_verified FROM jobs j JOIN employer_profiles ep ON j.employer_id = ep.id WHERE j.id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    job.required_skills = JSON.parse(job.required_skills || '[]');
    job.preferred_skills = JSON.parse(job.preferred_skills || '[]');
    job.assessment_config = job.assessment_config ? JSON.parse(job.assessment_config) : null;
    job.application_count = db.prepare('SELECT COUNT(*) as count FROM applications WHERE job_id = ?').get(job.id).count;

    // Check if current user has already applied
    if (req.user?.role === 'candidate') {
      const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
      if (profile) {
        const application = db.prepare('SELECT * FROM applications WHERE job_id = ? AND candidate_id = ?').get(job.id, profile.id);
        job.has_applied = !!application;
        job.application = application || null;
      }
    }

    res.json({ success: true, data: job });
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ success: false, message: 'Failed to get job' });
  }
});

// POST /api/jobs
router.post('/', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'employer') return res.status(403).json({ success: false, message: 'Only employers can post jobs' });

    const profile = db.prepare('SELECT id FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Employer profile not found' });

    const { title, description, required_skills, preferred_skills, min_experience_years = 3, max_experience_years, salary_min, salary_max, bounty_amount, location, job_type, requires_assessment = true, assessment_config, application_deadline, expected_joining_date } = req.body;

    if (!title || !description || !required_skills) {
      return res.status(400).json({ success: false, message: 'Title, description, and required skills are required' });
    }

    const result = db.prepare(`INSERT INTO jobs (employer_id, title, description, required_skills, preferred_skills, min_experience_years, max_experience_years, salary_min, salary_max, bounty_amount, location, job_type, requires_assessment, assessment_config, application_deadline, expected_joining_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      profile.id, title, description,
      JSON.stringify(required_skills),
      JSON.stringify(preferred_skills || []),
      min_experience_years, max_experience_years, salary_min, salary_max, bounty_amount || 0, location, job_type,
      requires_assessment ? 1 : 0,
      assessment_config ? JSON.stringify(assessment_config) : null,
      application_deadline, expected_joining_date || null
    );

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
    job.required_skills = JSON.parse(job.required_skills);
    job.preferred_skills = JSON.parse(job.preferred_skills || '[]');
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ success: false, message: 'Failed to create job' });
  }
});

// PUT /api/jobs/:id
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND employer_id = ?').get(req.params.id, profile.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const { title, description, required_skills, preferred_skills, min_experience_years, max_experience_years, salary_min, salary_max, bounty_amount, location, job_type, status, requires_assessment, assessment_config, application_deadline } = req.body;

    db.prepare(`UPDATE jobs SET title=COALESCE(?,title), description=COALESCE(?,description), required_skills=COALESCE(?,required_skills), preferred_skills=COALESCE(?,preferred_skills), min_experience_years=COALESCE(?,min_experience_years), max_experience_years=COALESCE(?,max_experience_years), salary_min=COALESCE(?,salary_min), salary_max=COALESCE(?,salary_max), bounty_amount=COALESCE(?,bounty_amount), location=COALESCE(?,location), job_type=COALESCE(?,job_type), status=COALESCE(?,status), requires_assessment=COALESCE(?,requires_assessment), assessment_config=COALESCE(?,assessment_config), application_deadline=COALESCE(?,application_deadline) WHERE id=?`).run(
      title, description,
      required_skills ? JSON.stringify(required_skills) : null,
      preferred_skills ? JSON.stringify(preferred_skills) : null,
      min_experience_years, max_experience_years, salary_min, salary_max, bounty_amount, location, job_type, status,
      requires_assessment != null ? (requires_assessment ? 1 : 0) : null,
      assessment_config ? JSON.stringify(assessment_config) : null,
      application_deadline, req.params.id
    );

    const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    updated.required_skills = JSON.parse(updated.required_skills);
    updated.preferred_skills = JSON.parse(updated.preferred_skills || '[]');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update job' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    db.prepare('DELETE FROM jobs WHERE id = ? AND employer_id = ?').run(req.params.id, profile.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete job' });
  }
});

export default router;
