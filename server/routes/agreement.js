import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { AGREEMENT_CONFIG } from '../config/agreement.js';
import crypto from 'crypto';

const router = Router();

// GET /api/agreement - Get current agreement
router.get('/', (req, res) => {
  res.json({ success: true, data: AGREEMENT_CONFIG });
});

// POST /api/agreement/accept - Accept agreement
router.post('/accept', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Only candidates need to accept the agreement' });
    }
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const textHash = crypto.createHash('sha256').update(JSON.stringify(AGREEMENT_CONFIG.clauses)).digest('hex');

    db.prepare(`INSERT INTO candidate_agreements (user_id, candidate_id, agreement_version, agreement_text_hash, ip_address) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, profile.id, AGREEMENT_CONFIG.version, textHash, ip);

    db.prepare(`UPDATE candidate_profiles SET agreement_accepted = 1, agreement_accepted_at = CURRENT_TIMESTAMP, agreement_version = ?, agreement_ip = ? WHERE id = ?`).run(AGREEMENT_CONFIG.version, ip, profile.id);

    res.json({ success: true, message: 'Agreement accepted' });
  } catch (err) {
    console.error('Agreement accept error:', err);
    res.status(500).json({ success: false, message: 'Failed to accept agreement' });
  }
});

export default router;
