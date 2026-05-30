import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/feedback/candidate/:candidateId
router.get('/candidate/:candidateId', (req, res) => {
  try {
    const feedback = db.prepare('SELECT id, candidate_id, manager_name, manager_title, company_name, relationship, worked_from, worked_to, overall_rating, technical_rating, communication_rating, leadership_rating, strengths, areas_of_improvement, would_rehire, comments, is_verified, created_at FROM manager_feedback WHERE candidate_id = ? AND is_verified = 1 ORDER BY created_at DESC').all(req.params.candidateId);
    res.json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get feedback' });
  }
});

// POST /api/feedback/request
router.post('/request', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false, message: 'Only candidates can request feedback' });

    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const { manager_name, manager_email, manager_title, company_name, relationship, worked_from, worked_to } = req.body;

    if (!manager_name || !manager_email || !company_name) {
      return res.status(400).json({ success: false, message: 'Manager name, email, and company are required' });
    }

    const token = uuidv4();

    const result = db.prepare('INSERT INTO manager_feedback (candidate_id, manager_name, manager_email, manager_title, company_name, relationship, worked_from, worked_to, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      profile.id, manager_name, manager_email, manager_title, company_name, relationship, worked_from, worked_to, token
    );

    const feedback = db.prepare('SELECT * FROM manager_feedback WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      data: feedback,
      message: `Feedback link: /feedback/submit/${token} (In production, this would be emailed to ${manager_email})`
    });
  } catch (err) {
    console.error('Request feedback error:', err);
    res.status(500).json({ success: false, message: 'Failed to request feedback' });
  }
});

// GET /api/feedback/verify/:token
router.get('/verify/:token', (req, res) => {
  try {
    const feedback = db.prepare('SELECT mf.*, cp.full_name as candidate_name FROM manager_feedback mf JOIN candidate_profiles cp ON mf.candidate_id = cp.id WHERE mf.verification_token = ?').get(req.params.token);
    if (!feedback) return res.status(404).json({ success: false, message: 'Invalid or expired token' });
    if (feedback.is_verified) return res.status(400).json({ success: false, message: 'Feedback already submitted' });

    res.json({ success: true, data: { candidate_name: feedback.candidate_name, manager_name: feedback.manager_name, company_name: feedback.company_name } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to verify token' });
  }
});

// POST /api/feedback/submit/:token
router.post('/submit/:token', (req, res) => {
  try {
    const feedback = db.prepare('SELECT * FROM manager_feedback WHERE verification_token = ?').get(req.params.token);
    if (!feedback) return res.status(404).json({ success: false, message: 'Invalid token' });
    if (feedback.is_verified) return res.status(400).json({ success: false, message: 'Already submitted' });

    const { overall_rating, technical_rating, communication_rating, leadership_rating, strengths, areas_of_improvement, would_rehire, comments } = req.body;

    db.prepare(`UPDATE manager_feedback SET overall_rating=?, technical_rating=?, communication_rating=?, leadership_rating=?, strengths=?, areas_of_improvement=?, would_rehire=?, comments=?, is_verified=1 WHERE id=?`).run(
      overall_rating, technical_rating, communication_rating, leadership_rating, strengths, areas_of_improvement, would_rehire ? 1 : 0, comments, feedback.id
    );

    res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
});

export default router;
