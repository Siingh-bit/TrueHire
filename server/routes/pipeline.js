import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/pipeline/create/:applicationId - Create pipeline entry (admin)
router.post('/create/:applicationId', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const existing = db.prepare('SELECT id FROM interview_pipeline WHERE application_id = ?').get(app.id);
    if (existing) return res.status(409).json({ success: false, message: 'Pipeline already exists for this application' });

    const result = db.prepare('INSERT INTO interview_pipeline (application_id, candidate_id, job_id) VALUES (?, ?, ?)').run(app.id, app.candidate_id, app.job_id);
    const pipeline = db.prepare('SELECT * FROM interview_pipeline WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: pipeline });
  } catch (err) {
    console.error('Create pipeline error:', err);
    res.status(500).json({ success: false, message: 'Failed to create pipeline' });
  }
});

// GET /api/pipeline/candidate - Get pipeline for logged-in candidate
router.get('/candidate', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const pipelines = db.prepare(`
      SELECT ip.*, j.title as job_title, ep.company_name,
        a.status as application_status, a.assessment_score
      FROM interview_pipeline ip
      JOIN jobs j ON ip.job_id = j.id
      JOIN employer_profiles ep ON j.employer_id = ep.id
      JOIN applications a ON ip.application_id = a.id
      WHERE ip.candidate_id = ?
      ORDER BY ip.created_at DESC
    `).all(profile.id);
    res.json({ success: true, data: pipelines });
  } catch (err) {
    console.error('Get candidate pipeline error:', err);
    res.status(500).json({ success: false, message: 'Failed to get pipeline' });
  }
});

// GET /api/pipeline/job/:jobId - Get pipeline for a job (employer)
router.get('/job/:jobId', authMiddleware, (req, res) => {
  try {
    const pipelines = db.prepare(`
      SELECT ip.*, cp.full_name, cp.headline, cp.total_experience_years,
        cp.available_to_switch_from, cp.verification_status,
        a.status as application_status, a.assessment_score
      FROM interview_pipeline ip
      JOIN candidate_profiles cp ON ip.candidate_id = cp.id
      JOIN applications a ON ip.application_id = a.id
      WHERE ip.job_id = ?
      ORDER BY ip.created_at DESC
    `).all(req.params.jobId);
    res.json({ success: true, data: pipelines });
  } catch (err) {
    console.error('Get job pipeline error:', err);
    res.status(500).json({ success: false, message: 'Failed to get pipeline' });
  }
});

// GET /api/pipeline/all - Get all pipelines (admin)
router.get('/all', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const pipelines = db.prepare(`
      SELECT ip.*, cp.full_name, cp.headline,
        j.title as job_title, ep.company_name,
        a.status as application_status, a.assessment_score
      FROM interview_pipeline ip
      JOIN candidate_profiles cp ON ip.candidate_id = cp.id
      JOIN jobs j ON ip.job_id = j.id
      JOIN employer_profiles ep ON j.employer_id = ep.id
      JOIN applications a ON ip.application_id = a.id
      ORDER BY ip.created_at DESC
    `).all();
    res.json({ success: true, data: pipelines });
  } catch (err) {
    console.error('Get all pipelines error:', err);
    res.status(500).json({ success: false, message: 'Failed to get pipelines' });
  }
});

// PUT /api/pipeline/:id/level1 - Update L1 status (admin)
router.put('/:id/level1', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { status, scheduled_at, notes } = req.body;
    const valid = ['pending', 'scheduled', 'cleared', 'rejected'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const updates = ['level1_status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    if (scheduled_at) { updates.push('level1_scheduled_at = ?'); params.push(scheduled_at); }
    if (status === 'cleared' || status === 'rejected') { updates.push('level1_completed_at = CURRENT_TIMESTAMP'); }
    if (notes) { updates.push('level1_notes = ?'); params.push(notes); }
    params.push(req.params.id);

    db.prepare(`UPDATE interview_pipeline SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const pipeline = db.prepare('SELECT * FROM interview_pipeline WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: pipeline });
  } catch (err) {
    console.error('Update L1 error:', err);
    res.status(500).json({ success: false, message: 'Failed to update L1' });
  }
});

// PUT /api/pipeline/:id/level2 - Update L2 status (admin, requires L1 cleared)
router.put('/:id/level2', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const pipeline = db.prepare('SELECT * FROM interview_pipeline WHERE id = ?').get(req.params.id);
    if (!pipeline) return res.status(404).json({ success: false, message: 'Pipeline not found' });
    if (pipeline.level1_status !== 'cleared') return res.status(400).json({ success: false, message: 'Level 1 must be cleared first' });

    const { status, scheduled_at, notes } = req.body;
    const valid = ['pending', 'scheduled', 'cleared', 'rejected'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const updates = ['level2_status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    if (scheduled_at) { updates.push('level2_scheduled_at = ?'); params.push(scheduled_at); }
    if (status === 'cleared' || status === 'rejected') { updates.push('level2_completed_at = CURRENT_TIMESTAMP'); }
    if (notes) { updates.push('level2_notes = ?'); params.push(notes); }
    params.push(req.params.id);

    db.prepare(`UPDATE interview_pipeline SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updated = db.prepare('SELECT * FROM interview_pipeline WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update L2 error:', err);
    res.status(500).json({ success: false, message: 'Failed to update L2' });
  }
});

// PUT /api/pipeline/:id/send-to-employer - Send to employer (admin, requires L1+L2 cleared)
router.put('/:id/send-to-employer', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const pipeline = db.prepare('SELECT * FROM interview_pipeline WHERE id = ?').get(req.params.id);
    if (!pipeline) return res.status(404).json({ success: false, message: 'Pipeline not found' });
    if (pipeline.level1_status !== 'cleared' || pipeline.level2_status !== 'cleared') {
      return res.status(400).json({ success: false, message: 'Both Level 1 and Level 2 must be cleared' });
    }
    db.prepare('UPDATE interview_pipeline SET sent_to_employer = 1, sent_to_employer_at = CURRENT_TIMESTAMP, employer_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('pending', req.params.id);
    const updated = db.prepare('SELECT * FROM interview_pipeline WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Send to employer error:', err);
    res.status(500).json({ success: false, message: 'Failed to send to employer' });
  }
});

// PUT /api/pipeline/:id/employer-status - Update employer status (employer)
router.put('/:id/employer-status', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'employer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Employer or admin only' });
    }
    const { status, notes } = req.body;
    const valid = ['pending', 'interested', 'reserved', 'final_round_pending', 'offer_released', 'joined', 'rejected'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const updates = ['employer_status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    if (notes) { updates.push('employer_notes = ?'); params.push(notes); }
    params.push(req.params.id);

    db.prepare(`UPDATE interview_pipeline SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updated = db.prepare('SELECT * FROM interview_pipeline WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update employer status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update employer status' });
  }
});

export default router;
