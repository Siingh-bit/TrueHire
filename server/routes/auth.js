import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/schema.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again after 10 minutes' }
});

const router = Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/send-otp
router.post('/send-otp', authLimiter, async (req, res) => {
  try {
    const { email, type, password } = req.body;
    
    if (!email || !type) {
      return res.status(400).json({ success: false, message: 'Email and type are required' });
    }

    if (type === 'register') {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid OTP type' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10 minutes

    db.prepare('DELETE FROM otp_codes WHERE email = ? AND type = ?').run(email, type);
    db.prepare('INSERT INTO otp_codes (email, otp, type, expires_at) VALUES (?, ?, ?, ?)').run(email, otp, type, expiresAt);

    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
    let fallbackToDevMode = false;

    // HTTP Email API (Bypasses Render's SMTP Firewall)
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Switchera Auth <onboarding@resend.dev>',
            to: isDev ? 'delivered@resend.dev' : email,
            subject: 'Your Switchera Verification Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #2d79f2; text-align: center;">Switchera Account Verification</h2>
                <p>Hello,</p>
                <p>Thank you for registering. Please use the following 6-digit code to verify your email address:</p>
                <div style="background-color: #f4f7f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 4px; margin: 20px 0;">
                  ${otp}
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                <p style="margin-top: 30px; font-size: 14px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} Switchera. All rights reserved.</p>
              </div>
            `
          })
        });
        
        if (!resendRes.ok) {
          const errData = await resendRes.json();
          throw new Error(errData.message || 'Resend API Error');
        }
      } catch (apiErr) {
        console.error('HTTP API Send Error:', apiErr);
        return res.status(500).json({ success: false, message: 'Email Error (HTTP): ' + apiErr.message });
      }
    } 
    // Standard SMTP
    else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail({
          from: `"Switchera Auth" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Your Switchera Verification Code`,
          text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
          html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`,
        });
      } catch (emailErr) {
        console.error('SMTP Send Error:', emailErr);
        return res.status(500).json({ success: false, message: 'Email Error: ' + emailErr.message });
      }
    } else {
      // If no credentials are provided, fallback to returning the OTP to the frontend
      console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
      fallbackToDevMode = true;
    }

    res.json({ 
      success: true, 
      message: 'OTP processed', 
      devOtp: (isDev || fallbackToDevMode) ? otp : undefined 
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

const verifyOTP = (email, otp, type) => {
  const record = db.prepare('SELECT * FROM otp_codes WHERE email = ? AND type = ? ORDER BY created_at DESC LIMIT 1').get(email, type);
  if (!record) return { valid: false, message: 'No OTP requested for this email' };
  
  if (record.otp !== otp) return { valid: false, message: 'Invalid OTP' };
  
  if (new Date(record.expires_at) < new Date()) {
    db.prepare('DELETE FROM otp_codes WHERE id = ?').run(record.id);
    return { valid: false, message: 'OTP has expired' };
  }
  
  db.prepare('DELETE FROM otp_codes WHERE email = ? AND type = ?').run(email, type);
  return { valid: true };
};

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, password, role, otp, ...profileData } = req.body;

    if (!email || !password || !role || !otp) {
      return res.status(400).json({ success: false, message: 'Email, password, role, and OTP are required' });
    }

    const otpCheck = verifyOTP(email, otp, 'register');
    if (!otpCheck.valid) {
      return res.status(400).json({ success: false, message: otpCheck.message });
    }

    if (!['candidate', 'employer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be candidate or employer' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Experience is optional — freshers are welcome (no minimum).

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
        Number(profileData.total_experience_years) || 0,
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
router.post('/login', authLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Admin access is restricted to the configured owner email only.
    if ((user.role === 'admin' || user.role === 'super_admin') &&
        email.toLowerCase() !== (process.env.ADMIN_EMAIL || '').toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Invalid credentials' });
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

// PUT /api/auth/name — update display name (role-aware)
router.put('/name', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    if (req.user.role === 'candidate') {
      db.prepare('UPDATE candidate_profiles SET full_name = ? WHERE user_id = ?').run(name.trim(), req.user.id);
    } else if (req.user.role === 'employer') {
      db.prepare('UPDATE employer_profiles SET company_name = ? WHERE user_id = ?').run(name.trim(), req.user.id);
    }
    res.json({ success: true, message: 'Name updated' });
  } catch (err) {
    console.error('Update name error:', err);
    res.status(500).json({ success: false, message: 'Failed to update name' });
  }
});

// PUT /api/auth/email — change email (requires current password)
router.put('/email', authMiddleware, (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword) return res.status(400).json({ success: false, message: 'New email and current password are required' });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    const exists = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail, req.user.id);
    if (exists) return res.status(409).json({ success: false, message: 'That email is already in use' });
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail, req.user.id);
    res.json({ success: true, message: 'Email updated' });
  } catch (err) {
    console.error('Update email error:', err);
    res.status(500).json({ success: false, message: 'Failed to update email' });
  }
});

// POST /api/auth/change-password — change password (requires current password)
router.post('/change-password', authMiddleware, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Current and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
    res.json({ success: true, message: 'Password changed' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

export default router;
