import db from './server/db/schema.js';
try {
  const applications = db.prepare(`
      SELECT a.*, j.title as job_title, j.location as job_location, j.job_type, j.salary_min, j.salary_max, j.required_skills, j.requires_assessment,
        ep.company_name, ep.company_logo_url
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employer_profiles ep ON j.employer_id = ep.id
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
  `).all(1);
  console.log('Applications:', applications.map(a => ({ id: a.id, job_id: a.job_id, title: a.job_title })));
} catch (e) {
  console.error(e);
}
