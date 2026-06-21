import db from './schema.js';
import bcrypt from 'bcryptjs';

export function seedDB() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('📦 Database already seeded, skipping...');
    return;
  }

  const hash = bcrypt.hashSync('password123', 10);
  const insertUser = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)');
  const insertEmployer = db.prepare(`INSERT INTO employer_profiles (user_id, company_name, industry, company_size, website, description, headquarters, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertCandidate = db.prepare(`INSERT INTO candidate_profiles (user_id, full_name, phone, headline, summary, total_experience_years, current_location, preferred_locations, expected_salary_min, expected_salary_max, verification_status, verification_score, profile_completeness, is_open_to_work) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertJob = db.prepare(`INSERT INTO jobs (employer_id, title, description, required_skills, preferred_skills, min_experience_years, max_experience_years, salary_min, salary_max, location, job_type, requires_assessment, application_deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  let currentUserId = 1;

  // ── 5 Employers ──
  const companies = [
    { email: 'hr@technova.com', name: 'TechNova Solutions', ind: 'Information Technology', size: '1000-5000' },
    { email: 'hiring@cloudscale.io', name: 'CloudScale Systems', ind: 'Cloud Computing', size: '500-1000' },
    { email: 'talent@dataflow.ai', name: 'DataFlow Analytics', ind: 'Data & Analytics', size: '200-500' },
    { email: 'jobs@cybernet.dev', name: 'CyberNet Security', ind: 'Cybersecurity', size: '50-200' },
    { email: 'careers@globaltech.com', name: 'GlobalTech Innovations', ind: 'Information Technology', size: '5000+' }
  ];

  const employerIds = [];
  companies.forEach((company) => {
    insertUser.run(company.email, hash, 'employer');
    insertEmployer.run(currentUserId, company.name, company.ind, company.size, `https://${company.name.split(' ')[0].toLowerCase()}.com`, `${company.name} is a leading company in ${company.ind}.`, 'Global', 1);
    employerIds.push(currentUserId);
    currentUserId++;
  });

  // ── 10 Jobs per Employer (50 Total) ──
  const jobRoles = ['Software Engineer', 'Data Analyst', 'Product Manager', 'DevOps Engineer', 'UX Designer', 'Frontend Developer', 'Backend Developer', 'ML Engineer', 'QA Tester', 'System Admin', 'Data Scientist', 'Cloud Architect'];
  const locations = ['Remote', 'Bangalore', 'New York', 'London', 'Berlin'];
  
  employerIds.forEach((empId) => {
    // Generate 10 jobs per employer
    for (let i = 0; i < 10; i++) {
      const role = jobRoles[(empId + i) % jobRoles.length];
      const loc = locations[i % locations.length];
      insertJob.run(
        empId,
        `${role} - L${(i % 5) + 1}`,
        `We are looking for a skilled ${role} to join our team. You will work on exciting projects and help scale our systems.`,
        '["Python", "JavaScript", "SQL"]',
        '["AWS", "Docker", "React"]',
        Math.floor(Math.random() * 5) + 1,
        Math.floor(Math.random() * 5) + 6,
        Math.floor(Math.random() * 1000000) + 1000000,
        Math.floor(Math.random() * 2000000) + 2000000,
        loc,
        loc === 'Remote' ? 'remote' : 'full-time',
        Math.random() > 0.5 ? 1 : 0,
        '2026-12-31'
      );
    }
  });

  // ── 100 Candidates ──
  const candidateEmails = [];
  for (let i = 1; i <= 100; i++) {
    const email = i === 1 ? 'priya.sharma@email.com' : `candidate${i}@email.com`;
    insertUser.run(email, hash, 'candidate');
    candidateEmails.push(email);
    
    insertCandidate.run(
      currentUserId,
      i === 1 ? 'Priya Sharma' : `Candidate User ${i}`,
      `+1-555-01${i.toString().padStart(2, '0')}`,
      `${jobRoles[i % jobRoles.length]} Professional`,
      `Driven and experienced professional looking for the next big challenge.`,
      Math.floor(Math.random() * 10) + 3, // 3 to 12 years
      locations[i % locations.length],
      JSON.stringify(locations),
      Math.floor(Math.random() * 1000000) + 1000000,
      Math.floor(Math.random() * 2000000) + 2000000,
      Math.random() > 0.3 ? 'verified' : 'pending',
      Math.floor(Math.random() * 30) + 70, // 70 to 100 score
      Math.floor(Math.random() * 20) + 80, // 80 to 100 completeness
      1 // open to work
    );
    currentUserId++;
  }

  // Admin
  insertUser.run('admin@switchera.com', hash, 'admin');
  db.prepare('UPDATE users SET is_super_admin = 1 WHERE email = ?').run('admin@switchera.com');

  insertUser.run('admin1@switchera.com', hash, 'admin');
  insertUser.run('admin2@switchera.com', hash, 'admin');
  insertUser.run('admin3@switchera.com', hash, 'admin');
  insertUser.run('admin4@switchera.com', hash, 'admin');
  insertUser.run('admin5@switchera.com', hash, 'admin');

  db.prepare('UPDATE candidate_profiles SET agreement_accepted = 1, agreement_accepted_at = CURRENT_TIMESTAMP, agreement_version = ?').run('1.0');

  console.log('🌱 Database seeded with 100 candidates, 50 jobs, and 6 admins.');
}
