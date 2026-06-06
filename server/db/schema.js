import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let __dirname = '';
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch (e) {
  __dirname = process.cwd();
}

const dbPath = process.env.VERCEL ? '/tmp/truehire.db' : join(__dirname, 'truehire.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('candidate','employer','admin')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS candidate_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      full_name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      headline TEXT,
      summary TEXT,
      total_experience_years REAL NOT NULL CHECK(total_experience_years >= 3),
      current_location TEXT,
      preferred_locations TEXT,
      expected_salary_min INTEGER,
      expected_salary_max INTEGER,
      resume_url TEXT,
      verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','in_progress','verified','rejected')),
      verification_score REAL DEFAULT 0,
      profile_completeness INTEGER DEFAULT 0,
      is_open_to_work INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      institution TEXT NOT NULL,
      degree TEXT NOT NULL,
      field_of_study TEXT,
      start_year INTEGER,
      end_year INTEGER,
      grade TEXT,
      verification_status TEXT DEFAULT 'pending',
      verification_document_url TEXT
    );

    CREATE TABLE IF NOT EXISTS work_experience (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      company_name TEXT NOT NULL,
      job_title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      description TEXT,
      verification_status TEXT DEFAULT 'pending',
      verification_document_url TEXT
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      skill_name TEXT NOT NULL,
      proficiency_level TEXT CHECK(proficiency_level IN ('beginner','intermediate','advanced','expert')),
      years_of_experience REAL,
      is_verified INTEGER DEFAULT 0,
      assessment_score REAL
    );

    CREATE TABLE IF NOT EXISTS employer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      company_name TEXT NOT NULL,
      company_logo_url TEXT,
      industry TEXT,
      company_size TEXT,
      website TEXT,
      description TEXT,
      headquarters TEXT,
      is_verified INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER REFERENCES employer_profiles(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_skills TEXT NOT NULL,
      preferred_skills TEXT,
      min_experience_years INTEGER DEFAULT 3,
      max_experience_years INTEGER,
      salary_min INTEGER,
      salary_max INTEGER,
      bounty_amount INTEGER DEFAULT 0,
      location TEXT,
      job_type TEXT CHECK(job_type IN ('full-time','part-time','contract','remote')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','closed')),
      requires_assessment INTEGER DEFAULT 1,
      assessment_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      application_deadline TEXT
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      referrer_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'applied' CHECK(status IN ('applied','screening','assessment_pending','assessment_completed','shortlisted','interview','offered','hired','rejected')),
      cover_letter TEXT,
      video_cover_letter_url TEXT,
      rejection_reason TEXT,
      assessment_score REAL,
      assessment_completed_at DATETIME,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      job_id INTEGER REFERENCES jobs(id),
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      questions TEXT NOT NULL,
      answers TEXT,
      score REAL,
      total_time_seconds INTEGER,
      max_time_seconds INTEGER DEFAULT 3600,
      proctoring_violations TEXT,
      proctoring_score REAL DEFAULT 100,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','expired','flagged')),
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS manager_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      manager_name TEXT NOT NULL,
      manager_email TEXT NOT NULL,
      manager_title TEXT,
      company_name TEXT NOT NULL,
      relationship TEXT,
      worked_from TEXT,
      worked_to TEXT,
      overall_rating INTEGER CHECK(overall_rating BETWEEN 1 AND 5),
      technical_rating INTEGER CHECK(technical_rating BETWEEN 1 AND 5),
      communication_rating INTEGER CHECK(communication_rating BETWEEN 1 AND 5),
      leadership_rating INTEGER CHECK(leadership_rating BETWEEN 1 AND 5),
      strengths TEXT,
      areas_of_improvement TEXT,
      would_rehire INTEGER,
      comments TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      type TEXT CHECK(type IN ('login', 'register')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    );
    CREATE TABLE IF NOT EXISTS interview_pipeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      job_id INTEGER REFERENCES jobs(id),
      level1_status TEXT DEFAULT 'pending',
      level1_scheduled_at DATETIME,
      level1_completed_at DATETIME,
      level1_notes TEXT,
      level2_status TEXT DEFAULT 'pending',
      level2_scheduled_at DATETIME,
      level2_completed_at DATETIME,
      level2_notes TEXT,
      sent_to_employer INTEGER DEFAULT 0,
      sent_to_employer_at DATETIME,
      employer_status TEXT DEFAULT 'pending',
      employer_notes TEXT,
      cheating_flag INTEGER DEFAULT 0,
      cheating_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidate_agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      agreement_version TEXT NOT NULL,
      agreement_text_hash TEXT,
      accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER REFERENCES users(id),
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      action_type TEXT NOT NULL,
      reason TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidate_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      available_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS platform_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT CHECK(event_type IN ('page_view', 'app_download')) NOT NULL,
      path TEXT,
      user_agent TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidate_certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      skill_name TEXT NOT NULL,
      score REAL,
      is_certified INTEGER DEFAULT 0,
      taken_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS truehire_interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      job_id INTEGER REFERENCES jobs(id),
      round_number INTEGER NOT NULL,
      scheduled_at DATETIME,
      interviewer_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
      video_url TEXT,
      feedback_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      sender_id INTEGER REFERENCES users(id),
      receiver_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try { db.exec("ALTER TABLE jobs ADD COLUMN bounty_amount INTEGER DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN rejection_reason TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN video_cover_letter_url TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN referrer_id INTEGER REFERENCES users(id)"); } catch(e) {}

  // Phase 1: Job-switch platform migrations
  try { db.exec("ALTER TABLE users ADD COLUMN is_super_admin INTEGER DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN current_company_join_date TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN available_to_switch_from TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN notice_period_days INTEGER DEFAULT 30"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN preferred_interview_slots TEXT DEFAULT '[]'"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN preferred_interview_days TEXT DEFAULT '[]'"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN agreement_accepted INTEGER DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN agreement_accepted_at DATETIME"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN agreement_version TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN agreement_ip TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN account_status TEXT DEFAULT 'active'"); } catch(e) {}
  try { db.exec("ALTER TABLE candidate_profiles ADD COLUMN penalty_status TEXT DEFAULT 'none'"); } catch(e) {}
  try { db.exec("ALTER TABLE jobs ADD COLUMN expected_joining_date TEXT"); } catch(e) {}

  console.log('✅ Database tables initialized');
}

export default db;
