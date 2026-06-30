// Postgres (Supabase) data layer with a better-sqlite3-compatible SYNCHRONOUS API.
// This lets the rest of the app keep using db.prepare(...).get/all/run(...)
// unchanged, while data actually lives in Supabase Postgres (persists across deploys).
import { createSyncFn } from 'synckit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, 'sync-db.worker.js');

// runQuery({ text, params }) -> { rows, rowCount }  (runs synchronously)
const runQuery = createSyncFn(workerPath, { timeout: 60000 });

// Convert SQLite-style "?" placeholders to Postgres "$1, $2, ..."
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => '$' + (++i));
}

// better-sqlite3 accepts .get(a, b) or .get([a, b]); normalize to a flat array.
function normalizeParams(params) {
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  return params;
}

const db = {
  prepare(sql) {
    const text = toPg(sql);
    const isInsert = /^\s*insert\s/i.test(sql);
    return {
      get(...params) {
        const r = runQuery({ text, params: normalizeParams(params) });
        return r.rows[0];
      },
      all(...params) {
        const r = runQuery({ text, params: normalizeParams(params) });
        return r.rows;
      },
      run(...params) {
        let q = text;
        if (isInsert && !/returning/i.test(text)) q = text + ' RETURNING id';
        const r = runQuery({ text: q, params: normalizeParams(params) });
        return { lastInsertRowid: r.rows[0] ? r.rows[0].id : undefined, changes: r.rowCount };
      },
    };
  },
  exec(sql) {
    runQuery({ text: sql, params: [] });
  },
  // better-sqlite3 transaction(fn) returns a callable; we run it directly
  // (each statement still commits individually — fine for this app's needs).
  transaction(fn) {
    return (...args) => fn(...args);
  },
  pragma() { /* no-op on Postgres */ },
};

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('candidate','employer','admin')) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS candidate_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id),
      full_name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      headline TEXT,
      summary TEXT,
      total_experience_years REAL NOT NULL DEFAULT 0 CHECK(total_experience_years >= 0),
      current_location TEXT,
      preferred_locations TEXT,
      expected_salary_min INTEGER,
      expected_salary_max INTEGER,
      resume_url TEXT,
      verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','in_progress','verified','rejected')),
      verification_score REAL DEFAULT 0,
      profile_completeness INTEGER DEFAULT 0,
      is_open_to_work INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS education (
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      skill_name TEXT NOT NULL,
      proficiency_level TEXT CHECK(proficiency_level IN ('beginner','intermediate','advanced','expert')),
      years_of_experience REAL,
      is_verified INTEGER DEFAULT 0,
      assessment_score REAL
    );

    CREATE TABLE IF NOT EXISTS employer_profiles (
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      application_deadline TEXT
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id),
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      referrer_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'applied' CHECK(status IN ('applied','screening','assessment_pending','assessment_completed','shortlisted','interview','offered','hired','rejected')),
      cover_letter TEXT,
      video_cover_letter_url TEXT,
      rejection_reason TEXT,
      assessment_score REAL,
      assessment_completed_at TIMESTAMPTZ,
      applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id SERIAL PRIMARY KEY,
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
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS manager_feedback (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      type TEXT CHECK(type IN ('login', 'register')) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interview_pipeline (
      id SERIAL PRIMARY KEY,
      application_id INTEGER REFERENCES applications(id),
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      job_id INTEGER REFERENCES jobs(id),
      level1_status TEXT DEFAULT 'pending',
      level1_scheduled_at TIMESTAMPTZ,
      level1_completed_at TIMESTAMPTZ,
      level1_notes TEXT,
      level2_status TEXT DEFAULT 'pending',
      level2_scheduled_at TIMESTAMPTZ,
      level2_completed_at TIMESTAMPTZ,
      level2_notes TEXT,
      sent_to_employer INTEGER DEFAULT 0,
      sent_to_employer_at TIMESTAMPTZ,
      employer_status TEXT DEFAULT 'pending',
      employer_notes TEXT,
      cheating_flag INTEGER DEFAULT 0,
      cheating_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidate_agreements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      agreement_version TEXT NOT NULL,
      agreement_text_hash TEXT,
      accepted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_actions (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES users(id),
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      action_type TEXT NOT NULL,
      reason TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidate_availability (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      available_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS platform_analytics (
      id SERIAL PRIMARY KEY,
      event_type TEXT CHECK(event_type IN ('page_view', 'app_download')) NOT NULL,
      path TEXT,
      user_agent TEXT,
      ip_address TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidate_certifications (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      skill_name TEXT NOT NULL,
      score REAL,
      is_certified INTEGER DEFAULT 0,
      taken_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS truehire_interviews (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER REFERENCES candidate_profiles(id),
      job_id INTEGER REFERENCES jobs(id),
      round_number INTEGER NOT NULL,
      scheduled_at TIMESTAMPTZ,
      interviewer_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
      video_url TEXT,
      feedback_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      application_id INTEGER REFERENCES applications(id),
      sender_id INTEGER REFERENCES users(id),
      receiver_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS bounty_amount INTEGER DEFAULT 0;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS video_cover_letter_url TEXT;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS referrer_id INTEGER REFERENCES users(id);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin INTEGER DEFAULT 0;
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS current_company_join_date TEXT;
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS available_to_switch_from TEXT;
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS notice_period_days INTEGER DEFAULT 30;
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS preferred_interview_slots TEXT DEFAULT '[]';
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS preferred_interview_days TEXT DEFAULT '[]';
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agreement_accepted INTEGER DEFAULT 0;
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ;
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agreement_version TEXT;
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agreement_ip TEXT;
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS penalty_status TEXT DEFAULT 'none';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expected_joining_date TEXT;
    ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS work_preferences TEXT DEFAULT '[]';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_types TEXT DEFAULT '[]';
  `);

  console.log('✅ Database tables initialized (Postgres / Supabase)');
}

export default db;
