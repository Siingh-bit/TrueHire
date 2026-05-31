import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/applications/candidate - Get my applications
router.get('/candidate', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false, message: 'Not a candidate' });

    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const applications = db.prepare(`
      SELECT a.*, j.title as job_title, j.location as job_location, j.job_type, j.salary_min, j.salary_max, j.required_skills, j.requires_assessment,
        ep.company_name, ep.company_logo_url
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employer_profiles ep ON j.employer_id = ep.id
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
    `).all(profile.id);

    const parsed = applications.map(a => ({
      ...a,
      required_skills: JSON.parse(a.required_skills || '[]'),
    }));

    // Check if assessment exists for each
    const withAssessment = parsed.map(a => {
      const assessment = db.prepare('SELECT id, status, score FROM assessments WHERE application_id = ?').get(a.id);
      return { ...a, assessment: assessment || null };
    });

    res.json({ success: true, data: withAssessment });
  } catch (err) {
    console.error('Get candidate applications error:', err);
    res.status(500).json({ success: false, message: 'Failed to get applications' });
  }
});

// GET /api/applications/job/:jobId - Get applications for a job (employer)
router.get('/job/:jobId', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'employer') return res.status(403).json({ success: false, message: 'Not an employer' });

    const profile = db.prepare('SELECT id FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND employer_id = ?').get(req.params.jobId, profile.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const applications = db.prepare(`
      SELECT a.*, cp.full_name, cp.headline, cp.total_experience_years, cp.verification_status, cp.verification_score, cp.avatar_url, cp.current_location
      FROM applications a
      JOIN candidate_profiles cp ON a.candidate_id = cp.id
      WHERE a.job_id = ?
      ORDER BY a.applied_at DESC
    `).all(req.params.jobId);

    const withDetails = applications.map(a => {
      const skills = db.prepare('SELECT * FROM skills WHERE candidate_id = ?').all(a.candidate_id);
      const assessment = db.prepare('SELECT * FROM assessments WHERE application_id = ?').get(a.id);
      const feedbackCount = db.prepare('SELECT COUNT(*) as count FROM manager_feedback WHERE candidate_id = ? AND is_verified = 1').get(a.candidate_id).count;
      return { ...a, skills, assessment, feedback_count: feedbackCount };
    });

    res.json({ success: true, data: withDetails });
  } catch (err) {
    console.error('Get job applications error:', err);
    res.status(500).json({ success: false, message: 'Failed to get applications' });
  }
});

import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max

// POST /api/applications/upload-video
router.post('/upload-video', authMiddleware, upload.single('video'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No video uploaded' });
    res.json({ success: true, url: '/uploads/' + req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// POST /api/applications - Apply for a job
router.post('/', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false, message: 'Only candidates can apply' });

    const profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { job_id, cover_letter, video_cover_letter_url, referrer_id } = req.body;

    const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND status = ?').get(job_id, 'active');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or closed' });

    const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?').get(job_id, profile.id);
    if (existing) return res.status(409).json({ success: false, message: 'Already applied' });

    if (profile.total_experience_years < job.min_experience_years) {
      return res.status(400).json({ success: false, message: `Minimum ${job.min_experience_years} years experience required` });
    }

    const initialStatus = job.requires_assessment ? 'assessment_pending' : 'applied';

    const result = db.prepare('INSERT INTO applications (job_id, candidate_id, status, cover_letter, video_cover_letter_url, referrer_id) VALUES (?, ?, ?, ?, ?, ?)').run(job_id, profile.id, initialStatus, cover_letter, video_cover_letter_url, referrer_id || null);

    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ success: false, message: 'Failed to apply' });
  }
});

// PUT /api/applications/:id/status - Update application status (employer)
router.put('/:id/status', authMiddleware, (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    const application = db.prepare('SELECT a.*, j.employer_id FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = ?').get(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (req.user.role === 'employer') {
      const profile = db.prepare('SELECT id FROM employer_profiles WHERE user_id = ?').get(req.user.id);
      if (application.employer_id !== profile.id) return res.status(403).json({ success: false, message: 'Not your job posting' });
    }

    db.prepare('UPDATE applications SET status = ?, rejection_reason = COALESCE(?, rejection_reason), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, rejection_reason || null, req.params.id);

    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

export default router;
