import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/schema.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, password, role, ...profileData } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required' });
    }

    if (!['candidate', 'employer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be candidate or employer' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    if (role === 'candidate' && (!profileData.total_experience_years || profileData.total_experience_years < 3)) {
      return res.status(400).json({ success: false, message: 'Minimum 3 years of experience required' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const userResult = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email, password_hash, role);
    const userId = userResult.lastInsertRowid;

    let profile = null;
    if (role === 'candidate') {
      db.prepare(`INSERT INTO candidate_profiles (user_id, full_name, phone, headline, total_experience_years, current_location) VALUES (?, ?, ?, ?, ?, ?)`).run(
        userId,
        profileData.full_name || 'New User',
        profileData.phone || null,
        profileData.headline || null,
        profileData.total_experience_years,
        profileData.current_location || null
      );
      profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(userId);
    } else {
      db.prepare(`INSERT INTO employer_profiles (user_id, company_name, industry, company_size, website) VALUES (?, ?, ?, ?, ?)`).run(
        userId,
        profileData.company_name || 'New Company',
        profileData.industry || null,
        profileData.company_size || null,
        profileData.website || null
      );
      profile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(userId);
    }

    const user = db.prepare('SELECT id, email, role, created_at FROM users WHERE id = ?').get(userId);
    const token = generateToken(user);

    res.status(201).json({ success: true, data: { token, user, profile } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let profile = null;
    if (user.role === 'candidate') {
      profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
    } else if (user.role === 'employer') {
      profile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(user.id);
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({ success: true, data: { token, user: safeUser, profile } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, role, created_at, is_active FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'candidate') {
      profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
    } else if (user.role === 'employer') {
      profile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(user.id);
    }

    res.json({ success: true, data: { user, profile } });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

export default router;
