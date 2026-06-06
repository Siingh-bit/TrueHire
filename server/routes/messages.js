import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/messages/:applicationId
router.get('/:applicationId', authMiddleware, (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const app = db.prepare('SELECT a.*, j.employer_id, c.user_id as candidate_user_id FROM applications a JOIN jobs j ON a.job_id = j.id JOIN candidate_profiles c ON a.candidate_id = c.id WHERE a.id = ?').get(applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    
    const isEmployer = req.user.role === 'employer' && db.prepare('SELECT id FROM employer_profiles WHERE user_id = ?').get(req.user.id)?.id === app.employer_id;
    const isCandidate = req.user.role === 'candidate' && app.candidate_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isEmployer && !isCandidate && !isAdmin) return res.status(403).json({ success: false, message: 'Access denied' });

    db.prepare('UPDATE messages SET is_read = 1 WHERE application_id = ? AND receiver_id = ?').run(applicationId, req.user.id);

    const messages = db.prepare(`
      SELECT m.*, u.role as sender_role, 
        COALESCE(c.full_name, e.company_name, 'Admin') as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN candidate_profiles c ON u.id = c.user_id
      LEFT JOIN employer_profiles e ON u.id = e.user_id
      WHERE m.application_id = ?
      ORDER BY m.created_at ASC
    `).all(applicationId);

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// POST /api/messages/:applicationId
router.post('/:applicationId', authMiddleware, (req, res) => {
  try {
    const { applicationId } = req.params;
    const { content } = req.body;
    
    const app = db.prepare('SELECT a.*, j.employer_id, e.user_id as employer_user_id, c.user_id as candidate_user_id FROM applications a JOIN jobs j ON a.job_id = j.id JOIN candidate_profiles c ON a.candidate_id = c.id JOIN employer_profiles e ON j.employer_id = e.id WHERE a.id = ?').get(applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const isEmployer = req.user.role === 'employer' && app.employer_user_id === req.user.id;
    const isCandidate = req.user.role === 'candidate' && app.candidate_user_id === req.user.id;

    if (!isEmployer && !isCandidate) return res.status(403).json({ success: false, message: 'Access denied' });

    const receiverId = isEmployer ? app.candidate_user_id : app.employer_user_id;

    const result = db.prepare('INSERT INTO messages (application_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)').run(applicationId, req.user.id, receiverId, content);

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// GET /api/messages/unread/count
router.get('/unread/count', authMiddleware, (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as c FROM messages WHERE receiver_id = ? AND is_read = 0').get(req.user.id).c;
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

export default router;
