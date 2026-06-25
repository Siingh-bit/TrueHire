import { Router } from 'express';
import db from '../db/schema.js';

const router = Router();

// POST /api/analytics/track
router.post('/track', (req, res) => {
  try {
    const { event_type, path } = req.body;
    
    if (!['page_view', 'app_download'].includes(event_type)) {
      return res.status(400).json({ success: false, message: 'Invalid event type' });
    }

    const userAgent = req.headers['user-agent'] || 'unknown';
    // For local dev, req.ip might be ::1, in production Render proxies set x-forwarded-for
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || 'unknown';

    db.prepare('INSERT INTO platform_analytics (event_type, path, user_agent, ip_address) VALUES (?, ?, ?, ?)')
      .run(event_type, path || null, userAgent, ipAddress);

    res.json({ success: true });
  } catch (err) {
    console.error('Analytics tracking error:', err);
    res.status(500).json({ success: false, message: 'Failed to track event' });
  }
});

import { authMiddleware } from '../middleware/auth.js';

// GET /api/analytics/employer - Fetch employer recruitment metrics
router.get('/employer', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'employer') return res.status(403).json({ success: false, message: 'Not an employer' });

    const profile = db.prepare('SELECT id FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Employer profile not found' });

    // Funnel metrics
    // We group by status for all applications belonging to this employer's jobs
    const funnelRows = db.prepare(`
      SELECT a.status, COUNT(*) as count 
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.employer_id = ?
      GROUP BY a.status
    `).all(profile.id);

    const metrics = {
      applied: 0,
      assessment_pending: 0,
      assessment_completed: 0,
      shortlisted: 0,
      interview: 0,
      offered: 0,
      hired: 0,
      rejected: 0
    };

    funnelRows.forEach(row => {
      if (metrics[row.status] !== undefined) {
        metrics[row.status] = row.count;
      }
    });

    // We can compute funnel steps
    const funnel = [
      { name: 'Applied', value: metrics.applied + metrics.assessment_pending + metrics.assessment_completed + metrics.shortlisted + metrics.interview + metrics.offered + metrics.hired + metrics.rejected },
      { name: 'Assessed', value: metrics.assessment_completed + metrics.shortlisted + metrics.interview + metrics.offered + metrics.hired },
      { name: 'Shortlisted', value: metrics.shortlisted + metrics.interview + metrics.offered + metrics.hired },
      { name: 'Interviewed', value: metrics.interview + metrics.offered + metrics.hired },
      { name: 'Hired', value: metrics.hired }
    ];

    // Average time to hire (for 'hired' candidates)
    // JulianDay differences give days. 
    const timeToHireRow = db.prepare(`
      SELECT AVG(EXTRACT(EPOCH FROM (a.updated_at - a.applied_at)) / 86400.0) as avg_days
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.employer_id = ? AND a.status = 'hired'
    `).get(profile.id);

    const avgTimeToHireDays = timeToHireRow?.avg_days ? Math.round(timeToHireRow.avg_days) : 0;

    // Drop-off rate during assessment
    // total asked to take assessment vs completed
    const askedAssessment = metrics.assessment_pending + metrics.assessment_completed + metrics.shortlisted + metrics.interview + metrics.offered + metrics.hired;
    const completedAssessment = metrics.assessment_completed + metrics.shortlisted + metrics.interview + metrics.offered + metrics.hired;
    const dropOffRate = askedAssessment > 0 ? Math.round(((askedAssessment - completedAssessment) / askedAssessment) * 100) : 0;

    res.json({ success: true, data: { funnel, avgTimeToHireDays, dropOffRate, totalActiveJobs: db.prepare('SELECT COUNT(*) as count FROM jobs WHERE employer_id = ? AND status = "active"').get(profile.id).count } });
  } catch (err) {
    console.error('Employer analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

export default router;
