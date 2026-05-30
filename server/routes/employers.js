import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/employers/:id
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const employer = db.prepare('SELECT * FROM employer_profiles WHERE id = ?').get(req.params.id);
    if (!employer) return res.status(404).json({ success: false, message: 'Employer not found' });
    res.json({ success: true, data: employer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get employer' });
  }
});

// PUT /api/employers/profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'employer') return res.status(403).json({ success: false, message: 'Not an employer' });
    const profile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { company_name, industry, company_size, website, description, headquarters } = req.body;
    db.prepare(`UPDATE employer_profiles SET company_name=COALESCE(?,company_name), industry=COALESCE(?,industry), company_size=COALESCE(?,company_size), website=COALESCE(?,website), description=COALESCE(?,description), headquarters=COALESCE(?,headquarters) WHERE id=?`).run(company_name, industry, company_size, website, description, headquarters, profile.id);

    const updated = db.prepare('SELECT * FROM employer_profiles WHERE id = ?').get(profile.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

export default router;
