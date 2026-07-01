import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

import db, { initDB } from './db/schema.js';
import { seedDB, ensureAdmin } from './db/seed.js';

import authRoutes from './routes/auth.js';
import candidateRoutes from './routes/candidates.js';
import employerRoutes from './routes/employers.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import assessmentRoutes from './routes/assessments.js';
import feedbackRoutes from './routes/feedback.js';
import agreementRoutes from './routes/agreement.js';
import pipelineRoutes from './routes/pipeline.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import certificationRoutes from './routes/certifications.js';
import interviewRoutes from './routes/interviews.js';
import messageRoutes from './routes/messages.js';

let __dirname = '';
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch (e) {
  __dirname = process.cwd();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/agreement', agreementRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Switchera API is running', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const distPath = join(__dirname, '..', 'dist');

// ---- SEO: server-rendered meta + JobPosting structured data + sitemap ----
const SITE = process.env.SITE_URL || 'https://switchera.in';
let __tpl = null;
const template = () => {
  if (__tpl == null) {
    try { __tpl = readFileSync(join(distPath, 'index.html'), 'utf8'); } catch (_) { __tpl = ''; }
  }
  return __tpl;
};
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => String(s ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const deslug = (s) => String(s ?? '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const clip = (s, n = 155) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

function renderMeta({ title, description, url, jsonld }) {
  let html = template();
  if (!html) return null;
  if (title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
               .replace(/(<meta name="title" content=")[^"]*(")/, `$1${esc(title)}$2`)
               .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
               .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  }
  if (description) {
    const d = esc(clip(description, 300));
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
               .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`)
               .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${d}$2`);
  }
  if (url) {
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`)
               .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`);
  }
  if (jsonld) {
    const safe = JSON.stringify(jsonld).replace(/</g, '\\u003c');
    html = html.replace('</head>', `    <script type="application/ld+json">${safe}</script>\n  </head>`);
  }
  return html;
}

const EMP_TYPE = { 'full-time': 'FULL_TIME', 'part-time': 'PART_TIME', contract: 'CONTRACTOR', freelance: 'CONTRACTOR', internship: 'INTERN', remote: 'FULL_TIME' };

// Job detail: JobPosting structured data + social preview tags
app.get('/jobs/:id', (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return next();
  try {
    const job = db.prepare(`SELECT j.id, j.title, j.description, j.location, j.job_type, j.salary_min, j.salary_max, j.created_at, j.application_deadline, j.status, ep.company_name FROM jobs j JOIN employer_profiles ep ON j.employer_id = ep.id WHERE j.id = ?`).get(req.params.id);
    if (!job) return next();
    const url = `${SITE}/jobs/${job.id}`;
    const posted = job.created_at && !isNaN(new Date(job.created_at)) ? new Date(job.created_at) : new Date();
    const jp = {
      '@context': 'https://schema.org/', '@type': 'JobPosting',
      title: job.title,
      description: `<p>${esc(job.description || job.title)}</p>`,
      datePosted: posted.toISOString(),
      employmentType: EMP_TYPE[job.job_type] || 'OTHER',
      hiringOrganization: { '@type': 'Organization', name: job.company_name, sameAs: SITE },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'IN' } },
      identifier: { '@type': 'PropertyValue', name: 'Switchera', value: String(job.id) },
      directApply: true,
    };
    if (job.application_deadline && !isNaN(new Date(job.application_deadline))) jp.validThrough = new Date(job.application_deadline).toISOString();
    if (job.job_type === 'remote') jp.jobLocationType = 'TELECOMMUTE';
    if (job.salary_min || job.salary_max) {
      jp.baseSalary = { '@type': 'MonetaryAmount', currency: 'INR', value: { '@type': 'QuantitativeValue', ...(job.salary_min ? { minValue: job.salary_min } : {}), ...(job.salary_max ? { maxValue: job.salary_max } : {}), unitText: 'YEAR' } };
    }
    const html = renderMeta({ title: `${job.title} at ${job.company_name} | Switchera`, description: clip(job.description || `${job.title} at ${job.company_name}`), url, jsonld: jp });
    if (!html) return next();
    res.set('Content-Type', 'text/html; charset=utf-8').send(html);
  } catch (e) { console.error('SEO job route:', e.message); next(); }
});

// Programmatic SEO landing pages (unique title + description)
function landing(res, next, meta) {
  try { const html = renderMeta(meta); if (!html) return next(); res.set('Content-Type', 'text/html; charset=utf-8').send(html); }
  catch (e) { next(); }
}
app.get('/jobs/location/:slug', (req, res, next) => { const d = deslug(req.params.slug); landing(res, next, { title: `Jobs in ${d} | Switchera`, description: `Browse verified jobs in ${d}. Apply with proven skills on Switchera — faster, fairer hiring.`, url: `${SITE}/jobs/location/${req.params.slug}` }); });
app.get('/jobs/role/:slug', (req, res, next) => { const d = deslug(req.params.slug); landing(res, next, { title: `${d} jobs | Switchera`, description: `Latest verified ${d} jobs on Switchera. Prove your skills and get hired faster.`, url: `${SITE}/jobs/role/${req.params.slug}` }); });
app.get('/jobs/skill/:slug', (req, res, next) => { const d = deslug(req.params.slug); landing(res, next, { title: `${d} jobs | Switchera`, description: `Find jobs that need ${d}. Verified employers and skill-based hiring on Switchera.`, url: `${SITE}/jobs/skill/${req.params.slug}` }); });
app.get('/company/:id', (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return next();
  try {
    const c = db.prepare('SELECT company_name, industry FROM employer_profiles WHERE id = ?').get(req.params.id);
    if (!c) return next();
    landing(res, next, { title: `${c.company_name} — jobs & careers | Switchera`, description: `Explore open roles at ${c.company_name}${c.industry ? ' (' + c.industry + ')' : ''} on Switchera.`, url: `${SITE}/company/${req.params.id}` });
  } catch (e) { next(); }
});

// Dynamic sitemap
const ROLE_VOCAB = ['software engineer','frontend developer','backend developer','full stack developer','data analyst','data scientist','product manager','ui ux designer','devops engineer','qa engineer','business analyst','marketing manager','sales executive','hr manager','accountant','content writer','project manager','machine learning engineer','mobile developer','graphic designer'];
app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE}/`, pri: '1.0' },
    { loc: `${SITE}/jobs`, pri: '0.9' },
    { loc: `${SITE}/register`, pri: '0.5' },
    { loc: `${SITE}/login`, pri: '0.3' },
  ];
  try {
    const rows = db.prepare("SELECT id, location, employer_id, required_skills, title, updated_at FROM jobs WHERE status = 'active' ORDER BY updated_at DESC LIMIT 5000").all();
    const locs = new Set(), skills = new Set(), emps = new Set(), roles = new Set(), titles = [];
    for (const r of rows) {
      const lm = r.updated_at ? new Date(r.updated_at) : null;
      urls.push({ loc: `${SITE}/jobs/${r.id}`, pri: '0.8', lastmod: lm && !isNaN(lm) ? lm.toISOString().slice(0, 10) : today });
      if (r.location) locs.add(slugify(r.location));
      if (r.employer_id) emps.add(r.employer_id);
      titles.push((r.title || '').toLowerCase());
      try { (JSON.parse(r.required_skills || '[]') || []).forEach(s => s && skills.add(slugify(s))); } catch (_) {}
    }
    ROLE_VOCAB.forEach(role => { if (titles.some(t => t.includes(role))) roles.add(slugify(role)); });
    [...locs].slice(0, 300).forEach(s => s && urls.push({ loc: `${SITE}/jobs/location/${s}`, pri: '0.6' }));
    [...skills].slice(0, 300).forEach(s => s && urls.push({ loc: `${SITE}/jobs/skill/${s}`, pri: '0.6' }));
    [...roles].forEach(s => s && urls.push({ loc: `${SITE}/jobs/role/${s}`, pri: '0.6' }));
    [...emps].slice(0, 500).forEach(id => urls.push({ loc: `${SITE}/company/${id}`, pri: '0.5' }));
  } catch (e) { console.error('sitemap:', e.message); }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.pri}</priority></url>`).join('\n') +
    `\n</urlset>\n`;
  res.set('Content-Type', 'application/xml; charset=utf-8').send(body);
});

app.use(express.static(distPath));
app.get(/(.*)/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

import { createServer } from 'http';
import { Server } from 'socket.io';

// Initialize and start
try {
  initDB();
  if (process.env.SEED_DEMO === 'true') {
    seedDB();
  }
  ensureAdmin();

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:5173', 'http://localhost:3000'],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    // Live Interview Room Logic
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', userId);

      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId);
      });

      socket.on('code-change', (code) => {
        socket.to(roomId).emit('code-update', code);
      });

      // WebRTC Signaling
      socket.on('offer', (payload) => {
        socket.to(roomId).emit('offer', payload);
      });

      socket.on('answer', (payload) => {
        socket.to(roomId).emit('answer', payload);
      });

      socket.on('ice-candidate', (payload) => {
        socket.to(roomId).emit('ice-candidate', payload);
      });
    });
  });

  if (!process.env.VERCEL) {
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Switchera API Server running at http://localhost:${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
      console.log(`\n📧 Demo Accounts (password: password123):`);
      console.log(`   Candidate: priya.sharma@email.com`);
      console.log(`   Employer:  hr@technova.com`);
      console.log(`   Admin:     admin@switchera.com\n`);
    });
  }
} catch (err) {
  console.error('Failed to start server:', err);
  if (!process.env.VERCEL) process.exit(1);
}

export default app;
