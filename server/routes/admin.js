import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

const superAdminOnly = (req, res, next) => {
  const user = db.prepare('SELECT is_super_admin FROM users WHERE id = ?').get(req.user.id);
  if (!user?.is_super_admin) return res.status(403).json({ success: false, message: 'Super admin access required' });
  next();
};

// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, adminOnly, (req, res) => {
  try {
    const totalVisitors = db.prepare("SELECT COUNT(*) as c FROM platform_analytics WHERE event_type = 'page_view'").get().c;
    const totalDownloads = db.prepare("SELECT COUNT(*) as c FROM platform_analytics WHERE event_type = 'app_download'").get().c;
    const totalCandidates = db.prepare('SELECT COUNT(*) as c FROM candidate_profiles').get().c;
    const totalEmployers = db.prepare('SELECT COUNT(*) as c FROM employer_profiles').get().c;
    const totalJobs = db.prepare('SELECT COUNT(*) as c FROM jobs').get().c;
    const candidatesHired = db.prepare("SELECT COUNT(DISTINCT candidate_id) as c FROM applications WHERE status = 'hired'").get().c;
    const employersHired = db.prepare("SELECT COUNT(DISTINCT j.employer_id) as c FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.status = 'hired'").get().c;
    const activePipelines = db.prepare('SELECT COUNT(*) as c FROM interview_pipeline').get().c;
    const agreementsPending = db.prepare('SELECT COUNT(*) as c FROM candidate_profiles WHERE agreement_accepted = 0').get().c;
    const bannedAccounts = db.prepare("SELECT COUNT(*) as c FROM candidate_profiles WHERE account_status IN ('temp_banned','perm_banned')").get().c;
    const recentActions = db.prepare(`
      SELECT aa.*, u.email as admin_email, cp.full_name as candidate_name
      FROM admin_actions aa
      JOIN users u ON aa.admin_id = u.id
      LEFT JOIN candidate_profiles cp ON aa.candidate_id = cp.id
      ORDER BY aa.created_at DESC LIMIT 10
    `).all();

    res.json({ success: true, data: { totalVisitors, totalDownloads, totalCandidates, totalEmployers, totalJobs, candidatesHired, employersHired, activePipelines, agreementsPending, bannedAccounts, recentActions } });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
});

// GET /api/admin/candidates
router.get('/candidates', authMiddleware, adminOnly, (req, res) => {
  try {
    const { search, account_status, agreement, penalty_status } = req.query;
    let query = 'SELECT cp.*, u.email, u.is_active FROM candidate_profiles cp JOIN users u ON cp.user_id = u.id WHERE 1=1';
    const params = [];
    if (search) { query += ' AND (cp.full_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (account_status) { query += ' AND cp.account_status = ?'; params.push(account_status); }
    if (agreement === 'pending') { query += ' AND cp.agreement_accepted = 0'; }
    if (agreement === 'accepted') { query += ' AND cp.agreement_accepted = 1'; }
    if (penalty_status) { query += ' AND cp.penalty_status = ?'; params.push(penalty_status); }
    query += ' ORDER BY cp.created_at DESC';
    const candidates = db.prepare(query).all(...params);
    res.json({ success: true, data: candidates });
  } catch (err) {
    console.error('Admin candidates error:', err);
    res.status(500).json({ success: false, message: 'Failed to load candidates' });
  }
});

// GET /api/admin/candidates/:id
router.get('/candidates/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    const candidate = db.prepare('SELECT cp.*, u.email, u.is_active FROM candidate_profiles cp JOIN users u ON cp.user_id = u.id WHERE cp.id = ?').get(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    const availability = db.prepare('SELECT * FROM candidate_availability WHERE candidate_id = ? ORDER BY available_date').all(req.params.id);
    const pipelines = db.prepare(`
      SELECT ip.*, j.title as job_title, ep.company_name
      FROM interview_pipeline ip
      JOIN jobs j ON ip.job_id = j.id
      JOIN employer_profiles ep ON j.employer_id = ep.id
      WHERE ip.candidate_id = ?
    `).all(req.params.id);
    const agreements = db.prepare('SELECT * FROM candidate_agreements WHERE candidate_id = ? ORDER BY accepted_at DESC').all(req.params.id);
    const actions = db.prepare(`
      SELECT aa.*, u.email as admin_email
      FROM admin_actions aa JOIN users u ON aa.admin_id = u.id
      WHERE aa.candidate_id = ? ORDER BY aa.created_at DESC
    `).all(req.params.id);
    res.json({ success: true, data: { ...candidate, availability, pipelines, agreements, actions } });
  } catch (err) {
    console.error('Admin candidate detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to load candidate' });
  }
});

// PUT /api/admin/candidates/:id/account-status
router.put('/candidates/:id/account-status', authMiddleware, adminOnly, (req, res) => {
  try {
    const { status, reason } = req.body;
    const valid = ['active', 'warned', 'temp_banned', 'perm_banned'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    db.prepare('UPDATE candidate_profiles SET account_status = ? WHERE id = ?').run(status, req.params.id);
    if (status === 'temp_banned' || status === 'perm_banned') {
      const cp = db.prepare('SELECT user_id FROM candidate_profiles WHERE id = ?').get(req.params.id);
      if (cp) db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(cp.user_id);
    } else if (status === 'active') {
      const cp = db.prepare('SELECT user_id FROM candidate_profiles WHERE id = ?').get(req.params.id);
      if (cp) db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(cp.user_id);
    }
    db.prepare('INSERT INTO admin_actions (admin_id, candidate_id, action_type, reason) VALUES (?, ?, ?, ?)').run(req.user.id, req.params.id, status === 'active' ? 'unban' : status, reason || null);
    res.json({ success: true, message: 'Account status updated' });
  } catch (err) {
    console.error('Update account status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// PUT /api/admin/candidates/:id/penalty
router.put('/candidates/:id/penalty', authMiddleware, adminOnly, (req, res) => {
  try {
    const { penalty_status, reason } = req.body;
    const valid = ['none', 'warning', 'temporary_ban', 'permanent_ban', 'compensation_pending'];
    if (!valid.includes(penalty_status)) return res.status(400).json({ success: false, message: 'Invalid penalty' });
    db.prepare('UPDATE candidate_profiles SET penalty_status = ? WHERE id = ?').run(penalty_status, req.params.id);
    db.prepare('INSERT INTO admin_actions (admin_id, candidate_id, action_type, reason) VALUES (?, ?, ?, ?)').run(req.user.id, req.params.id, 'penalty_update', reason || `Penalty set to: ${penalty_status}`);
    res.json({ success: true, message: 'Penalty updated' });
  } catch (err) {
    console.error('Update penalty error:', err);
    res.status(500).json({ success: false, message: 'Failed to update penalty' });
  }
});

// POST /api/admin/candidates/:id/notes
router.post('/candidates/:id/notes', authMiddleware, adminOnly, (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ success: false, message: 'Notes required' });
    db.prepare('INSERT INTO admin_actions (admin_id, candidate_id, action_type, notes) VALUES (?, ?, ?, ?)').run(req.user.id, req.params.id, 'note', notes);
    res.json({ success: true, message: 'Note added' });
  } catch (err) {
    console.error('Add note error:', err);
    res.status(500).json({ success: false, message: 'Failed to add note' });
  }
});

// PUT /api/admin/candidates/:id/cheating-flag
router.put('/candidates/:id/cheating-flag', authMiddleware, adminOnly, (req, res) => {
  try {
    const { flag, notes } = req.body;
    // Update all pipeline entries for this candidate
    db.prepare('UPDATE interview_pipeline SET cheating_flag = ?, cheating_notes = ? WHERE candidate_id = ?').run(flag ? 1 : 0, notes || null, req.params.id);
    db.prepare('INSERT INTO admin_actions (admin_id, candidate_id, action_type, reason, notes) VALUES (?, ?, ?, ?, ?)').run(req.user.id, req.params.id, 'cheating_flag', flag ? 'Flagged for cheating' : 'Cheating flag removed', notes || null);
    res.json({ success: true, message: flag ? 'Cheating flagged' : 'Cheating flag removed' });
  } catch (err) {
    console.error('Cheating flag error:', err);
    res.status(500).json({ success: false, message: 'Failed to update cheating flag' });
  }
});

// POST /api/admin/admins - Create new admin (super_admin only)
router.post('/admins', authMiddleware, adminOnly, superAdminOnly, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ success: false, message: 'Email already exists' });
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email, hash, 'admin');
    res.status(201).json({ success: true, message: 'Admin account created' });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
});

// GET /api/admin/admins - List all admins (super_admin only)
router.get('/admins', authMiddleware, adminOnly, superAdminOnly, (req, res) => {
  try {
    const admins = db.prepare("SELECT id, email, is_super_admin, created_at, is_active FROM users WHERE role = 'admin'").all();
    res.json({ success: true, data: admins });
  } catch (err) {
    console.error('List admins error:', err);
    res.status(500).json({ success: false, message: 'Failed to load admins' });
  }
});

export default router;
