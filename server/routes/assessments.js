import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Question pools by skill
const QUESTION_POOLS = {
  Python: [
    { text: 'What is the difference between a list and a tuple in Python?', type: 'mcq', options: ['Lists are immutable, tuples are mutable', 'Lists are mutable, tuples are immutable', 'Both are mutable', 'Both are immutable'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'What is a Python decorator and how does it work?', type: 'short_answer', correct_answer: 'A decorator is a function that takes another function as input and extends its behavior without modifying it. It uses the @decorator syntax and is commonly used for logging, authentication, and caching.', difficulty: 'medium', points: 8 },
    { text: 'Write a Python function that implements a binary search algorithm.', type: 'coding', correct_answer: 'def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: left = mid + 1\n        else: right = mid - 1\n    return -1', difficulty: 'medium', points: 10 },
    { text: 'Explain the GIL (Global Interpreter Lock) in Python.', type: 'short_answer', correct_answer: 'The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes simultaneously. It limits true parallelism in CPU-bound multi-threaded programs.', difficulty: 'hard', points: 12 },
    { text: 'What will be the output of: print([x**2 for x in range(5) if x % 2 == 0])?', type: 'mcq', options: ['[0, 4, 16]', '[1, 9, 25]', '[0, 2, 4]', '[4, 16]'], correct_answer: 0, difficulty: 'easy', points: 5 },
  ],
  SQL: [
    { text: 'What is the difference between INNER JOIN and LEFT JOIN?', type: 'mcq', options: ['No difference', 'INNER JOIN returns only matching rows; LEFT JOIN returns all left rows plus matches', 'LEFT JOIN returns only matching rows', 'INNER JOIN returns all rows'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'Write a SQL query to find the second highest salary from an employees table.', type: 'coding', correct_answer: 'SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);', difficulty: 'medium', points: 10 },
    { text: 'What is a window function in SQL? Give an example using ROW_NUMBER().', type: 'short_answer', correct_answer: 'Window functions perform calculations across a set of rows related to the current row without collapsing them. Example: SELECT name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) as rank FROM employees;', difficulty: 'medium', points: 8 },
    { text: 'Explain the difference between WHERE and HAVING clauses.', type: 'mcq', options: ['They are identical', 'WHERE filters before grouping, HAVING filters after grouping', 'HAVING filters before grouping, WHERE filters after', 'WHERE is for SELECT, HAVING is for INSERT'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'What is database normalization? Explain up to 3NF.', type: 'short_answer', correct_answer: '1NF: Atomic values, no repeating groups. 2NF: 1NF + no partial dependencies on composite keys. 3NF: 2NF + no transitive dependencies. Normalization reduces redundancy and improves data integrity.', difficulty: 'hard', points: 12 },
  ],
  JavaScript: [
    { text: 'What is the difference between let, const, and var?', type: 'mcq', options: ['No difference', 'var is function-scoped; let and const are block-scoped; const cannot be reassigned', 'let is function-scoped; var is block-scoped', 'All are block-scoped'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'Explain closures in JavaScript with an example.', type: 'short_answer', correct_answer: 'A closure is a function that retains access to its outer scope variables even after the outer function has returned. Example: function counter() { let count = 0; return () => ++count; }', difficulty: 'medium', points: 8 },
    { text: 'Write a function that debounces another function with a given delay.', type: 'coding', correct_answer: 'function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}', difficulty: 'medium', points: 10 },
    { text: 'What is the event loop in JavaScript?', type: 'short_answer', correct_answer: 'The event loop is a mechanism that handles asynchronous operations. It continuously checks the call stack and callback queue, pushing callbacks to the stack when it is empty, enabling non-blocking I/O.', difficulty: 'hard', points: 12 },
    { text: 'What does Promise.all() do?', type: 'mcq', options: ['Runs promises sequentially', 'Resolves when all promises resolve, rejects if any rejects', 'Always resolves', 'Runs only the first promise'], correct_answer: 1, difficulty: 'easy', points: 5 },
  ],
  React: [
    { text: 'What is the Virtual DOM in React?', type: 'mcq', options: ['A direct copy of the real DOM', 'A lightweight in-memory representation of the real DOM for efficient updates', 'A browser API', 'A CSS framework'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'Explain the useEffect hook and its cleanup function.', type: 'short_answer', correct_answer: 'useEffect runs side effects after render. It takes a callback and optional dependency array. The cleanup function (returned from callback) runs before re-execution or unmount, useful for subscriptions and timers.', difficulty: 'medium', points: 8 },
    { text: 'Write a custom React hook that tracks window dimensions.', type: 'coding', correct_answer: 'function useWindowSize() {\n  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });\n  useEffect(() => {\n    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });\n    window.addEventListener("resize", handler);\n    return () => window.removeEventListener("resize", handler);\n  }, []);\n  return size;\n}', difficulty: 'medium', points: 10 },
    { text: 'What is React.memo and when should you use it?', type: 'mcq', options: ['A state management tool', 'A higher-order component that memoizes rendering to prevent unnecessary re-renders', 'A routing library', 'A testing utility'], correct_answer: 1, difficulty: 'medium', points: 8 },
  ],
  'Node.js': [
    { text: 'What is the difference between process.nextTick() and setImmediate()?', type: 'short_answer', correct_answer: 'process.nextTick() executes in the current iteration of the event loop after the current operation, before any I/O. setImmediate() executes in the next iteration of the event loop, after I/O events.', difficulty: 'hard', points: 12 },
    { text: 'What are streams in Node.js?', type: 'mcq', options: ['Video streaming API', 'Objects for reading/writing data in chunks, enabling memory-efficient processing of large data', 'CSS animations', 'Database connections'], correct_answer: 1, difficulty: 'medium', points: 8 },
    { text: 'Write Express middleware that logs request method, URL, and response time.', type: 'coding', correct_answer: 'function logger(req, res, next) {\n  const start = Date.now();\n  res.on("finish", () => {\n    console.log(`${req.method} ${req.url} - ${Date.now() - start}ms`);\n  });\n  next();\n}', difficulty: 'medium', points: 10 },
  ],
  'Machine Learning': [
    { text: 'What is the bias-variance tradeoff?', type: 'short_answer', correct_answer: 'Bias is error from overly simplistic models (underfitting). Variance is error from overly complex models (overfitting). The tradeoff is finding the sweet spot that minimizes total error.', difficulty: 'medium', points: 8 },
    { text: 'What is gradient descent?', type: 'mcq', options: ['A sorting algorithm', 'An optimization algorithm that iteratively adjusts parameters to minimize a loss function', 'A data structure', 'A type of neural network'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'Explain the difference between L1 and L2 regularization.', type: 'short_answer', correct_answer: 'L1 (Lasso) adds absolute value of weights as penalty, promoting sparsity. L2 (Ridge) adds squared weights, preventing any single weight from being too large. L1 can zero out features; L2 shrinks them.', difficulty: 'hard', points: 12 },
    { text: 'What is cross-validation and why is it important?', type: 'mcq', options: ['Training on all data', 'A technique to evaluate model performance by splitting data into train/test folds multiple times', 'A type of neural network', 'Data cleaning technique'], correct_answer: 1, difficulty: 'easy', points: 5 },
  ],
  Kubernetes: [
    { text: 'What is a Pod in Kubernetes?', type: 'mcq', options: ['A virtual machine', 'The smallest deployable unit containing one or more containers', 'A network switch', 'A database'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'Explain the difference between a Deployment and a StatefulSet.', type: 'short_answer', correct_answer: 'Deployments manage stateless apps with interchangeable pods. StatefulSets manage stateful apps where each pod has a unique identity, stable network ID, and persistent storage.', difficulty: 'medium', points: 8 },
    { text: 'Write a basic Kubernetes deployment YAML for an nginx web server with 3 replicas.', type: 'coding', correct_answer: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: nginx\n  template:\n    metadata:\n      labels:\n        app: nginx\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:latest\n        ports:\n        - containerPort: 80', difficulty: 'medium', points: 10 },
  ],
  AWS: [
    { text: 'What is the difference between S3 and EBS?', type: 'mcq', options: ['They are the same', 'S3 is object storage; EBS is block storage attached to EC2 instances', 'EBS is object storage', 'S3 is for databases only'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'Explain the AWS Well-Architected Framework pillars.', type: 'short_answer', correct_answer: 'The 6 pillars are: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability. Each provides best practices for building secure, high-performing, resilient cloud architectures.', difficulty: 'hard', points: 12 },
    { text: 'What is an AWS Lambda function and when would you use it?', type: 'mcq', options: ['A virtual machine', 'A serverless compute service that runs code in response to events without managing servers', 'A database service', 'A networking tool'], correct_answer: 1, difficulty: 'easy', points: 5 },
  ],
  'Data Analysis': [
    { text: 'What is the difference between correlation and causation?', type: 'mcq', options: ['They are the same', 'Correlation measures statistical relationship; causation means one variable directly affects another', 'Causation is weaker than correlation', 'Correlation implies causation'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'Explain p-value and statistical significance.', type: 'short_answer', correct_answer: 'P-value is the probability of observing results at least as extreme as the actual results, assuming the null hypothesis is true. A result is statistically significant if p-value < significance level (typically 0.05).', difficulty: 'medium', points: 8 },
    { text: 'What is A/B testing and how do you determine sample size?', type: 'short_answer', correct_answer: 'A/B testing compares two versions to determine which performs better. Sample size depends on: baseline conversion rate, minimum detectable effect, statistical significance level (alpha), and power (1-beta).', difficulty: 'hard', points: 12 },
  ],
  'default': [
    { text: 'Describe a challenging technical problem you solved and your approach.', type: 'short_answer', correct_answer: 'Open-ended', difficulty: 'medium', points: 10 },
    { text: 'What is version control and why is it important?', type: 'mcq', options: ['A backup tool', 'A system for tracking and managing code changes collaboratively', 'A programming language', 'An IDE feature'], correct_answer: 1, difficulty: 'easy', points: 5 },
    { text: 'Explain the SOLID principles in software design.', type: 'short_answer', correct_answer: 'S: Single Responsibility. O: Open/Closed. L: Liskov Substitution. I: Interface Segregation. D: Dependency Inversion. These principles guide writing maintainable, extensible code.', difficulty: 'hard', points: 12 },
  ],
};

function generateQuestions(skills, config = {}) {
  const { difficulty = 'medium', count = 15 } = config;
  const questions = [];
  let id = 1;

  for (const skill of skills) {
    const pool = QUESTION_POOLS[skill] || QUESTION_POOLS['default'];
    const filtered = difficulty === 'all' ? pool : pool.filter(q => {
      if (difficulty === 'easy') return q.difficulty === 'easy' || q.difficulty === 'medium';
      if (difficulty === 'hard') return q.difficulty === 'medium' || q.difficulty === 'hard';
      return true;
    });

    for (const q of filtered) {
      if (questions.length >= count) break;
      questions.push({ ...q, id: id++, skill });
    }
  }

  // Fill remaining with default questions
  if (questions.length < count) {
    for (const q of QUESTION_POOLS['default']) {
      if (questions.length >= count) break;
      questions.push({ ...q, id: id++, skill: 'General' });
    }
  }

  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions.slice(0, count);
}

// GET /api/assessments/:id
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    assessment.questions = JSON.parse(assessment.questions);
    assessment.answers = assessment.answers ? JSON.parse(assessment.answers) : null;
    assessment.proctoring_violations = assessment.proctoring_violations ? JSON.parse(assessment.proctoring_violations) : [];

    // Don't show correct answers if assessment is in progress
    if (assessment.status === 'in_progress' || assessment.status === 'pending') {
      assessment.questions = assessment.questions.map(q => {
        const { correct_answer, ...rest } = q;
        return rest;
      });
    }

    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get assessment' });
  }
});

// POST /api/assessments/generate/:applicationId
router.post('/generate/:applicationId', authMiddleware, (req, res) => {
  try {
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.applicationId);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    const existing = db.prepare('SELECT id FROM assessments WHERE application_id = ?').get(application.id);
    if (existing) return res.status(409).json({ success: false, message: 'Assessment already exists', data: { id: existing.id } });

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(application.job_id);
    const skills = JSON.parse(job.required_skills || '[]');
    const config = job.assessment_config ? JSON.parse(job.assessment_config) : {};

    const questions = generateQuestions(skills, { difficulty: config.difficulty, count: 15 });
    const maxTime = (config.duration || 45) * 60;

    const result = db.prepare('INSERT INTO assessments (application_id, job_id, candidate_id, questions, max_time_seconds) VALUES (?, ?, ?, ?, ?)').run(
      application.id, job.id, application.candidate_id, JSON.stringify(questions), maxTime
    );

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(result.lastInsertRowid);
    assessment.questions = JSON.parse(assessment.questions).map(q => {
      const { correct_answer, ...rest } = q;
      return rest;
    });

    res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    console.error('Generate assessment error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate assessment' });
  }
});

// PUT /api/assessments/:id/start
router.put('/:id/start', authMiddleware, (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    if (assessment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Assessment already started or completed' });
    }

    db.prepare('UPDATE assessments SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?').run('in_progress', req.params.id);

    const updated = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    updated.questions = JSON.parse(updated.questions).map(q => {
      const { correct_answer, ...rest } = q;
      return rest;
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to start assessment' });
  }
});

// PUT /api/assessments/:id/submit
router.put('/:id/submit', authMiddleware, (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    const { answers } = req.body;
    const questions = JSON.parse(assessment.questions);

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((q, i) => {
      totalPoints += q.points;
      const userAnswer = answers[i];
      if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
        if (q.type === 'mcq' && userAnswer === q.correct_answer) {
          earnedPoints += q.points;
        } else if (q.type === 'coding' || q.type === 'short_answer') {
          // Simplified scoring for text answers - give partial credit
          if (userAnswer && userAnswer.length > 20) {
            earnedPoints += q.points * 0.7; // 70% for attempting
          } else if (userAnswer && userAnswer.length > 0) {
            earnedPoints += q.points * 0.3;
          }
        }
      }
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const startedAt = new Date(assessment.started_at);
    const totalTime = Math.round((Date.now() - startedAt.getTime()) / 1000);

    db.prepare('UPDATE assessments SET answers = ?, score = ?, total_time_seconds = ?, status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      JSON.stringify(answers), score, totalTime, 'completed', req.params.id
    );

    // Update application
    db.prepare('UPDATE applications SET status = ?, assessment_score = ?, assessment_completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      'assessment_completed', score, assessment.application_id
    );

    const updated = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    updated.questions = JSON.parse(updated.questions);
    updated.answers = JSON.parse(updated.answers);
    updated.proctoring_violations = JSON.parse(updated.proctoring_violations || '[]');

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Submit assessment error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit assessment' });
  }
});

// PUT /api/assessments/:id/violation
router.put('/:id/violation', authMiddleware, (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    const violations = JSON.parse(assessment.proctoring_violations || '[]');
    violations.push({ ...req.body, timestamp: new Date().toISOString() });

    const newScore = Math.max(0, assessment.proctoring_score - (req.body.severity === 'high' ? 15 : req.body.severity === 'medium' ? 8 : 3));

    db.prepare('UPDATE assessments SET proctoring_violations = ?, proctoring_score = ? WHERE id = ?').run(
      JSON.stringify(violations), newScore, req.params.id
    );

    // Flag if too many violations
    if (newScore < 40) {
      db.prepare('UPDATE assessments SET status = ? WHERE id = ?').run('flagged', req.params.id);
    }

    res.json({ success: true, data: { proctoring_score: newScore, violation_count: violations.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to log violation' });
  }
});

export default router;
