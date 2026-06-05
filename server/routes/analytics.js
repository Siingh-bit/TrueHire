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

export default router;
