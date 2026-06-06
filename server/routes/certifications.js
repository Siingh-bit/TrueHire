import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { QUESTION_POOLS, generateQuestions } from './assessments.js';

const router = Router();

// GET /api/certifications/available - List available skills to certify
router.get('/available', authMiddleware, (req, res) => {
  const skills = Object.keys(QUESTION_POOLS).filter(s => s !== 'default');
  res.json({ success: true, data: skills });
});

// GET /api/certifications/my - Get candidate's certifications
router.get('/my', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false, message: 'Only candidates have certifications' });
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const certs = db.prepare('SELECT * FROM candidate_certifications WHERE candidate_id = ?').all(profile.id);
    res.json({ success: true, data: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch certifications' });
  }
});

// POST /api/certifications/generate - Generate certification test
router.post('/generate', authMiddleware, (req, res) => {
  try {
    const { skill } = req.body;
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false, message: 'Only candidates can take certifications' });
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);

    const existing = db.prepare('SELECT id FROM candidate_certifications WHERE candidate_id = ? AND skill_name = ? AND is_certified = 1').get(profile.id, skill);
    if (existing) return res.status(400).json({ success: false, message: 'Already certified in this skill' });
    
    const questions = generateQuestions([skill], { difficulty: 'hard', count: 10 });
    const maxTime = 30 * 60; // 30 mins
    
    const result = db.prepare('INSERT INTO assessments (candidate_id, questions, max_time_seconds, status) VALUES (?, ?, ?, ?)').run(
      profile.id, JSON.stringify(questions), maxTime, 'pending'
    );
    
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(result.lastInsertRowid);
    assessment.questions = JSON.parse(assessment.questions).map(q => {
      const { correct_answer, ...rest } = q;
      return rest;
    });

    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error('Generate cert error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate certification test' });
  }
});

// POST /api/certifications/submit/:id - Submit certification test
router.post('/submit/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ success: false });
    const profile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ? AND candidate_id = ?').get(req.params.id, profile.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    if (assessment.application_id || assessment.job_id) return res.status(400).json({ success: false, message: 'Not a certification assessment' });

    const { answers, skill } = req.body; 
    const questions = JSON.parse(assessment.questions);
    
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((q, i) => {
      totalPoints += q.points;
      const userAnswer = answers[i];
      if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
        if (q.type === 'mcq' && userAnswer === q.correct_answer) {
          earnedPoints += q.points;
        } else if (q.type === 'coding' || q.type === 'short_answer') {
          if (userAnswer && userAnswer.length > 20) earnedPoints += q.points * 0.7;
          else if (userAnswer && userAnswer.length > 0) earnedPoints += q.points * 0.3;
        }
      }
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= 80 ? 1 : 0;
    
    db.prepare('UPDATE assessments SET answers = ?, score = ?, status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      JSON.stringify(answers), score, 'completed', req.params.id
    );

    db.prepare('INSERT INTO candidate_certifications (candidate_id, skill_name, score, is_certified) VALUES (?, ?, ?, ?)').run(
      profile.id, skill, score, passed
    );

    res.json({ success: true, data: { score, passed: !!passed } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit certification' });
  }
});

export default router;
