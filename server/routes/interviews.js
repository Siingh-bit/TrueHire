import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/interviews/schedule - Candidate picks a slot
router.post('/schedule', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false, message: 'Only candidates can schedule interviews' });
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const { job_id, scheduled_at } = req.body;

    const existing = db.prepare('SELECT id FROM truehire_interviews WHERE candidate_id = ? AND job_id = ? AND round_number = 1').get(profile.id, job_id);
    if (existing) {
      db.prepare('UPDATE truehire_interviews SET scheduled_at = ?, status = ? WHERE id = ?').run(scheduled_at, 'scheduled', existing.id);
    } else {
      db.prepare('INSERT INTO truehire_interviews (candidate_id, job_id, round_number, scheduled_at, status) VALUES (?, ?, 1, ?, ?)')
        .run(profile.id, job_id, scheduled_at, 'scheduled');
    }

    res.json({ success: true, message: 'Interview scheduled successfully' });
  } catch (err) {
    console.error('Error scheduling interview:', err);
    res.status(500).json({ success: false, message: 'Failed to schedule interview: ' + err.message });
  }
});

// GET /api/interviews/my - Candidate gets their interviews
router.get('/my', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false });
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const interviews = db.prepare(`
      SELECT i.*, j.title as job_title, e.company_name 
      FROM truehire_interviews i 
      JOIN jobs j ON i.job_id = j.id
      JOIN employer_profiles e ON j.employer_id = e.id
      WHERE i.candidate_id = ?
    `).all(profile.id);
    res.json({ success: true, data: interviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch interviews' });
  }
});

// GET /api/interviews/all - Admin gets all interviews
router.get('/all', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false });
    const interviews = db.prepare(`
      SELECT i.*, c.full_name as candidate_name, j.title as job_title, e.company_name 
      FROM truehire_interviews i 
      JOIN candidate_profiles c ON i.candidate_id = c.id
      JOIN jobs j ON i.job_id = j.id
      JOIN employer_profiles e ON j.employer_id = e.id
      ORDER BY i.scheduled_at DESC
    `).all();
    res.json({ success: true, data: interviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch interviews' });
  }
});

// PUT /api/interviews/:id/recording - Admin uploads recording
router.put('/:id/recording', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false });
    const { video_url, feedback_notes, status } = req.body;
    db.prepare('UPDATE truehire_interviews SET video_url = ?, feedback_notes = ?, status = ?, interviewer_id = ? WHERE id = ?')
      .run(video_url, feedback_notes, status || 'completed', req.user.id, req.params.id);
    res.json({ success: true, message: 'Recording and feedback saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save recording' });
  }
});

export default router;
