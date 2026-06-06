import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initDB } from './db/schema.js';
import { seedDB } from './db/seed.js';

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
  res.json({ success: true, message: 'TrueHire API is running', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get(/(.*)/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Initialize and start
try {
  initDB();
  seedDB();
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`\n🚀 TrueHire API Server running at http://localhost:${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
      console.log(`\n📧 Demo Accounts (password: password123):`);
      console.log(`   Candidate: priya.sharma@email.com`);
      console.log(`   Employer:  hr@technova.com`);
      console.log(`   Admin:     admin@truehire.com\n`);
    });
  }
} catch (err) {
  console.error('Failed to start server:', err);
  if (!process.env.VERCEL) process.exit(1);
}

export default app;
