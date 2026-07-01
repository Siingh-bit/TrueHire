/**
 * Seed demo data: ONE employer account + 7 sample jobs.
 * Inserts straight into your Supabase Postgres, so the jobs show up live
 * immediately and persist. Safe to re-run — it never duplicates and never
 * touches candidate data or any other account.
 *
 * Run from the project root:
 *   node --env-file=.env scripts/seed-demo-jobs.js
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const EMPLOYER = {
  email: 'demo.employer@switchera.in',
  password: 'Demo@12345',
  company_name: 'TechNova Solutions',
  industry: 'Information Technology',
  company_size: '51-200',
  website: 'https://technova.example.com',
  headquarters: 'Bangalore, India',
  description: 'TechNova Solutions builds data and cloud products for fast-growing companies across India. We hire on proven skills, not just resumes.',
};

const deadline = '2026-12-31';

const JOBS = [
  {
    title: 'Senior Data Analyst',
    location: 'Bangalore, India',
    job_type: 'full-time',
    work_types: ['full-time'],
    min: 3, max: 6, salary_min: 1800000, salary_max: 2600000, bounty: 25000,
    required: ['SQL', 'Python', 'Power BI', 'Data Analysis'],
    preferred: ['Statistics', 'Tableau'],
    requires_assessment: true,
    description: 'We are looking for a Senior Data Analyst to turn raw data into decisions. You will build dashboards, run deep-dive analyses, and partner with product and business teams.\n\nResponsibilities:\n- Build and maintain reporting in SQL and Power BI\n- Run analyses that drive product and revenue decisions\n- Define metrics and monitor data quality\n\nRequirements:\n- Strong SQL and Python\n- Experience with BI tools (Power BI or Tableau)\n- 3+ years in an analytics role',
  },
  {
    title: 'Frontend Engineer (React)',
    location: 'Pune, India',
    job_type: 'full-time',
    work_types: ['full-time'],
    min: 2, max: 5, salary_min: 1400000, salary_max: 2200000, bounty: 0,
    required: ['React', 'JavaScript', 'TypeScript', 'CSS'],
    preferred: ['REST APIs', 'HTML'],
    requires_assessment: true,
    description: 'Join our product team to craft fast, accessible interfaces used by thousands of job seekers.\n\nResponsibilities:\n- Build responsive UI in React + TypeScript\n- Collaborate closely with design and backend\n- Care about performance and accessibility\n\nRequirements:\n- 2+ years with React\n- Solid CSS and component architecture',
  },
  {
    title: 'Backend Engineer (Node.js)',
    location: 'Remote (India)',
    job_type: 'remote',
    work_types: ['full-time', 'contract'],
    min: 3, max: 7, salary_min: 2000000, salary_max: 3200000, bounty: 40000,
    required: ['Node.js', 'PostgreSQL', 'AWS', 'REST APIs'],
    preferred: ['Docker', 'Redis'],
    requires_assessment: true,
    description: 'Own backend services end to end — APIs, data models, and deployments — in a fully remote team.\n\nResponsibilities:\n- Design and build Node.js APIs\n- Model data in PostgreSQL\n- Deploy and monitor on AWS\n\nRequirements:\n- 3+ years backend experience\n- Strong with Node.js and SQL databases',
  },
  {
    title: 'Product Manager',
    location: 'Mumbai, India',
    job_type: 'full-time',
    work_types: ['full-time'],
    min: 4, max: 8, salary_min: 2500000, salary_max: 4000000, bounty: 50000,
    required: ['Product Management', 'Data Analysis', 'Agile'],
    preferred: ['SQL', 'Product Strategy'],
    requires_assessment: false,
    description: 'Lead the roadmap for a product that reaches thousands of candidates and employers.\n\nResponsibilities:\n- Own discovery, prioritization, and delivery\n- Work with engineering, design, and data\n- Define success metrics and iterate\n\nRequirements:\n- 4+ years in product management\n- Comfortable with data-driven decisions',
  },
  {
    title: 'UI/UX Designer',
    location: 'Bangalore, India',
    job_type: 'full-time',
    work_types: ['full-time', 'freelance'],
    min: 2, max: 5, salary_min: 1200000, salary_max: 2000000, bounty: 0,
    required: ['Figma', 'UX', 'UI Design'],
    preferred: ['Prototyping', 'Design Systems'],
    requires_assessment: false,
    description: 'Design clean, trustworthy experiences for a hiring platform built on merit.\n\nResponsibilities:\n- Own flows from wireframe to polished UI in Figma\n- Contribute to and grow our design system\n- Validate designs with real users\n\nRequirements:\n- 2+ years product design experience\n- Strong Figma portfolio',
  },
  {
    title: 'Marketing Executive',
    location: 'New Delhi, India',
    job_type: 'full-time',
    work_types: ['full-time', 'internship'],
    min: 0, max: 3, salary_min: 500000, salary_max: 900000, bounty: 0,
    required: ['SEO', 'Content Writing', 'Social Media'],
    preferred: ['Google Analytics', 'Email Marketing'],
    requires_assessment: false,
    description: 'Great first role for a fresher who loves growth and content. Freshers are welcome to apply.\n\nResponsibilities:\n- Create content and run social channels\n- Support SEO and email campaigns\n- Track and report on growth metrics\n\nRequirements:\n- 0-3 years experience (freshers welcome)\n- Strong writing and communication',
  },
  {
    title: 'DevOps Engineer',
    location: 'Hyderabad, India',
    job_type: 'contract',
    work_types: ['contract'],
    min: 3, max: 6, salary_min: 1800000, salary_max: 2800000, bounty: 30000,
    required: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
    preferred: ['AWS', 'Monitoring'],
    requires_assessment: true,
    description: 'Keep our platform fast, reliable, and easy to ship to.\n\nResponsibilities:\n- Build and maintain CI/CD pipelines\n- Manage containers and infrastructure as code\n- Improve observability and reliability\n\nRequirements:\n- 3+ years in DevOps/SRE\n- Hands-on with Docker, Kubernetes, and Terraform',
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Run with:  node --env-file=.env scripts/seed-demo-jobs.js');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('🔌 Connected to database');

  // 1) Employer user (create if missing)
  let user = (await client.query('SELECT id FROM users WHERE email = $1', [EMPLOYER.email])).rows[0];
  if (!user) {
    const hash = bcrypt.hashSync(EMPLOYER.password, 10);
    user = (await client.query(
      "INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, 'employer', 1) RETURNING id",
      [EMPLOYER.email, hash]
    )).rows[0];
    console.log(`👤 Created employer user (${EMPLOYER.email})`);
  } else {
    console.log(`👤 Employer user already exists (${EMPLOYER.email})`);
  }

  // 2) Employer profile (create if missing)
  let profile = (await client.query('SELECT id FROM employer_profiles WHERE user_id = $1', [user.id])).rows[0];
  if (!profile) {
    profile = (await client.query(
      `INSERT INTO employer_profiles (user_id, company_name, industry, company_size, website, description, headquarters, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1) RETURNING id`,
      [user.id, EMPLOYER.company_name, EMPLOYER.industry, EMPLOYER.company_size, EMPLOYER.website, EMPLOYER.description, EMPLOYER.headquarters]
    )).rows[0];
    console.log(`🏢 Created company profile (${EMPLOYER.company_name})`);
  } else {
    console.log(`🏢 Company profile already exists (${EMPLOYER.company_name})`);
  }

  // 3) Jobs (insert only if a job with the same title doesn't already exist for this employer)
  let created = 0, skipped = 0;
  for (const j of JOBS) {
    const exists = (await client.query('SELECT id FROM jobs WHERE employer_id = $1 AND title = $2', [profile.id, j.title])).rows[0];
    if (exists) { skipped++; console.log(`   ↷ skip (exists): ${j.title}`); continue; }
    await client.query(
      `INSERT INTO jobs
        (employer_id, title, description, required_skills, preferred_skills, min_experience_years, max_experience_years,
         salary_min, salary_max, bounty_amount, location, job_type, work_types, requires_assessment, assessment_config,
         application_deadline, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'active')`,
      [
        profile.id, j.title, j.description,
        JSON.stringify(j.required), JSON.stringify(j.preferred),
        j.min, j.max, j.salary_min, j.salary_max, j.bounty,
        j.location, j.job_type, JSON.stringify(j.work_types),
        j.requires_assessment ? 1 : 0,
        JSON.stringify({ difficulty: 'medium', duration: 45 }),
        deadline,
      ]
    );
    created++;
    console.log(`   ✅ created: ${j.title}`);
  }

  console.log(`\nDone. ${created} job(s) created, ${skipped} already existed.`);
  console.log(`\nEmployer login (optional, to manage these jobs):`);
  console.log(`   Email:    ${EMPLOYER.email}`);
  console.log(`   Password: ${EMPLOYER.password}`);
  console.log(`\nNow create a candidate account on the site and browse the jobs to test.`);

  await client.end();
}

main().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
