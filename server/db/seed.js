import db from './schema.js';
import bcrypt from 'bcryptjs';

export function seedDB() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('📦 Database already seeded, skipping...');
    return;
  }

  const hash = bcrypt.hashSync('password123', 10);

  // ── Create Users ──
  const insertUser = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)');

  // Employers
  insertUser.run('hr@technova.com', hash, 'employer');
  insertUser.run('hiring@cloudscale.io', hash, 'employer');
  insertUser.run('talent@dataflow.ai', hash, 'employer');

  // Candidates
  insertUser.run('priya.sharma@email.com', hash, 'candidate');
  insertUser.run('rahul.kumar@email.com', hash, 'candidate');
  insertUser.run('anjali.patel@email.com', hash, 'candidate');
  insertUser.run('vikram.singh@email.com', hash, 'candidate');
  insertUser.run('neha.gupta@email.com', hash, 'candidate');
  insertUser.run('arjun.reddy@email.com', hash, 'candidate');
  insertUser.run('sneha.iyer@email.com', hash, 'candidate');
  insertUser.run('amit.joshi@email.com', hash, 'candidate');

  // Admin
  insertUser.run('admin@truehire.com', hash, 'admin');

  // ── Employer Profiles ──
  const insertEmployer = db.prepare(`INSERT INTO employer_profiles (user_id, company_name, industry, company_size, website, description, headquarters, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  insertEmployer.run(1, 'TechNova Solutions', 'Information Technology', '1000-5000', 'https://technova.com', 'Leading enterprise software company specializing in cloud-native solutions and AI-driven platforms. We build the future of digital transformation.', 'Bangalore, India', 1);
  insertEmployer.run(2, 'CloudScale Systems', 'Cloud Computing', '500-1000', 'https://cloudscale.io', 'Next-generation cloud infrastructure company providing scalable, secure, and intelligent cloud solutions for enterprises worldwide.', 'Hyderabad, India', 1);
  insertEmployer.run(3, 'DataFlow Analytics', 'Data & Analytics', '200-500', 'https://dataflow.ai', 'Pioneering data analytics firm leveraging machine learning and big data to transform business insights into actionable intelligence.', 'Pune, India', 1);

  // ── Candidate Profiles ──
  const insertCandidate = db.prepare(`INSERT INTO candidate_profiles (user_id, full_name, phone, headline, summary, total_experience_years, current_location, preferred_locations, expected_salary_min, expected_salary_max, verification_status, verification_score, profile_completeness, is_open_to_work) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  insertCandidate.run(4, 'Priya Sharma', '+91-9876543210', 'Senior Data Analyst | Python | SQL | Tableau', 'Experienced data analyst with 6+ years of expertise in transforming complex datasets into actionable business insights. Proficient in Python, SQL, and modern BI tools.', 6, 'Bangalore, India', '["Bangalore","Hyderabad","Remote"]', 1500000, 2500000, 'verified', 92, 95, 1);
  insertCandidate.run(5, 'Rahul Kumar', '+91-9876543211', 'Full Stack Developer | React | Node.js | AWS', 'Passionate full-stack developer with 5 years of experience building scalable web applications. Expert in React ecosystem and cloud architectures.', 5, 'Mumbai, India', '["Mumbai","Pune","Remote"]', 1800000, 3000000, 'verified', 88, 90, 1);
  insertCandidate.run(6, 'Anjali Patel', '+91-9876543212', 'DevOps Engineer | Kubernetes | CI/CD | Terraform', 'DevOps specialist with 7 years driving infrastructure automation and cloud migrations. Certified AWS Solutions Architect and Kubernetes Administrator.', 7, 'Hyderabad, India', '["Hyderabad","Bangalore","Remote"]', 2000000, 3500000, 'verified', 95, 100, 1);
  insertCandidate.run(7, 'Vikram Singh', '+91-9876543213', 'ML Engineer | TensorFlow | PyTorch | NLP', 'Machine learning engineer with 4 years of experience deploying production ML systems. Specialized in NLP and computer vision applications.', 4, 'Delhi, India', '["Delhi","Bangalore","Remote"]', 2000000, 3200000, 'in_progress', 45, 70, 1);
  insertCandidate.run(8, 'Neha Gupta', '+91-9876543214', 'Backend Developer | Java | Spring Boot | Microservices', 'Seasoned Java developer with 8 years building enterprise-grade microservices. Expert in distributed systems and database optimization.', 8, 'Pune, India', '["Pune","Mumbai"]', 2500000, 4000000, 'verified', 90, 85, 1);
  insertCandidate.run(9, 'Arjun Reddy', '+91-9876543215', 'Frontend Developer | React | TypeScript | Next.js', 'Creative frontend developer with 5 years crafting pixel-perfect, accessible web experiences. Strong eye for design and performance optimization.', 5, 'Chennai, India', '["Chennai","Bangalore","Remote"]', 1600000, 2800000, 'pending', 0, 60, 1);
  insertCandidate.run(10, 'Sneha Iyer', '+91-9876543216', 'Data Scientist | Machine Learning | Statistics', 'Data scientist with 6 years of experience in predictive modeling, A/B testing, and statistical analysis for product-driven organizations.', 6, 'Bangalore, India', '["Bangalore","Remote"]', 2200000, 3500000, 'verified', 87, 92, 0);
  insertCandidate.run(11, 'Amit Joshi', '+91-9876543217', 'Cloud Architect | AWS | Azure | GCP', 'Multi-cloud architect with 10 years of experience designing highly available, cost-optimized cloud architectures for Fortune 500 companies.', 10, 'Noida, India', '["Noida","Delhi","Remote"]', 3500000, 5000000, 'verified', 98, 100, 1);

  // ── Education ──
  const insertEdu = db.prepare(`INSERT INTO education (candidate_id, institution, degree, field_of_study, start_year, end_year, grade, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  insertEdu.run(1, 'Indian Institute of Technology, Delhi', 'B.Tech', 'Computer Science', 2014, 2018, '8.9 CGPA', 'verified');
  insertEdu.run(1, 'Indian Statistical Institute', 'M.Sc', 'Statistics', 2018, 2020, '9.1 CGPA', 'verified');
  insertEdu.run(2, 'BITS Pilani', 'B.E.', 'Information Technology', 2015, 2019, '8.5 CGPA', 'verified');
  insertEdu.run(3, 'NIT Warangal', 'B.Tech', 'Electronics & Communication', 2013, 2017, '8.7 CGPA', 'verified');
  insertEdu.run(4, 'IIT Bombay', 'B.Tech', 'Computer Science', 2016, 2020, '9.0 CGPA', 'pending');
  insertEdu.run(5, 'IIIT Hyderabad', 'B.Tech', 'Computer Science', 2012, 2016, '8.8 CGPA', 'verified');
  insertEdu.run(6, 'VIT Vellore', 'B.Tech', 'Computer Science', 2015, 2019, '8.4 CGPA', 'pending');
  insertEdu.run(7, 'IISc Bangalore', 'M.Tech', 'Data Science', 2016, 2018, '9.2 CGPA', 'verified');
  insertEdu.run(8, 'DTU Delhi', 'B.Tech', 'Computer Engineering', 2010, 2014, '8.6 CGPA', 'verified');

  // ── Work Experience ──
  const insertExp = db.prepare(`INSERT INTO work_experience (candidate_id, company_name, job_title, start_date, end_date, description, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?)`);

  insertExp.run(1, 'Flipkart', 'Data Analyst', '2020-06-01', '2022-12-31', 'Analyzed customer behavior patterns using Python and SQL, leading to 15% improvement in recommendation accuracy.', 'verified');
  insertExp.run(1, 'Amazon', 'Senior Data Analyst', '2023-01-01', null, 'Leading the analytics team for supply chain optimization. Built dashboards reducing delivery prediction errors by 20%.', 'verified');
  insertExp.run(2, 'Infosys', 'Software Developer', '2019-07-01', '2021-06-30', 'Developed full-stack web applications using React and Node.js for banking clients.', 'verified');
  insertExp.run(2, 'Razorpay', 'Senior Developer', '2021-07-01', null, 'Building scalable payment processing systems handling 10M+ daily transactions.', 'verified');
  insertExp.run(3, 'TCS', 'DevOps Engineer', '2017-06-01', '2019-12-31', 'Implemented CI/CD pipelines and containerized deployments for enterprise clients.', 'verified');
  insertExp.run(3, 'Microsoft', 'Senior DevOps Engineer', '2020-01-01', null, 'Managing Kubernetes clusters and infrastructure automation for Azure services.', 'verified');
  insertExp.run(5, 'Wipro', 'Java Developer', '2016-06-01', '2019-12-31', 'Built microservices architecture for banking applications using Spring Boot.', 'verified');
  insertExp.run(5, 'Goldman Sachs', 'Senior Backend Engineer', '2020-01-01', null, 'Designing high-frequency trading systems processing millions of transactions per second.', 'verified');
  insertExp.run(8, 'Accenture', 'Cloud Consultant', '2014-07-01', '2018-06-30', 'Led cloud migration projects for 20+ enterprise clients to AWS and Azure.', 'verified');
  insertExp.run(8, 'Google', 'Senior Cloud Architect', '2018-07-01', null, 'Designing multi-cloud architectures for Google Cloud Platform enterprise customers.', 'verified');

  // ── Skills ──
  const insertSkill = db.prepare(`INSERT INTO skills (candidate_id, skill_name, proficiency_level, years_of_experience, is_verified, assessment_score) VALUES (?, ?, ?, ?, ?, ?)`);

  // Priya (Data Analyst)
  insertSkill.run(1, 'Python', 'expert', 5, 1, 92);
  insertSkill.run(1, 'SQL', 'expert', 6, 1, 95);
  insertSkill.run(1, 'Tableau', 'advanced', 4, 1, 88);
  insertSkill.run(1, 'Power BI', 'advanced', 3, 0, null);
  insertSkill.run(1, 'Machine Learning', 'intermediate', 2, 0, null);

  // Rahul (Full Stack)
  insertSkill.run(2, 'JavaScript', 'expert', 5, 1, 90);
  insertSkill.run(2, 'React', 'expert', 4, 1, 93);
  insertSkill.run(2, 'Node.js', 'advanced', 4, 1, 85);
  insertSkill.run(2, 'AWS', 'intermediate', 2, 0, null);
  insertSkill.run(2, 'TypeScript', 'advanced', 3, 0, null);

  // Anjali (DevOps)
  insertSkill.run(3, 'Kubernetes', 'expert', 5, 1, 96);
  insertSkill.run(3, 'Docker', 'expert', 6, 1, 94);
  insertSkill.run(3, 'Terraform', 'advanced', 4, 1, 89);
  insertSkill.run(3, 'AWS', 'expert', 6, 1, 91);
  insertSkill.run(3, 'CI/CD', 'expert', 7, 1, 97);

  // Vikram (ML)
  insertSkill.run(4, 'Python', 'expert', 4, 0, null);
  insertSkill.run(4, 'TensorFlow', 'advanced', 3, 0, null);
  insertSkill.run(4, 'PyTorch', 'advanced', 2, 0, null);
  insertSkill.run(4, 'NLP', 'advanced', 3, 0, null);

  // Neha (Backend)
  insertSkill.run(5, 'Java', 'expert', 8, 1, 94);
  insertSkill.run(5, 'Spring Boot', 'expert', 6, 1, 92);
  insertSkill.run(5, 'Microservices', 'expert', 5, 1, 90);
  insertSkill.run(5, 'SQL', 'expert', 8, 1, 96);

  // Amit (Cloud)
  insertSkill.run(8, 'AWS', 'expert', 10, 1, 98);
  insertSkill.run(8, 'Azure', 'expert', 7, 1, 95);
  insertSkill.run(8, 'GCP', 'advanced', 4, 1, 88);
  insertSkill.run(8, 'Terraform', 'expert', 6, 1, 93);

  // ── Jobs ──
  const insertJob = db.prepare(`INSERT INTO jobs (employer_id, title, description, required_skills, preferred_skills, min_experience_years, max_experience_years, salary_min, salary_max, location, job_type, requires_assessment, assessment_config, application_deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  insertJob.run(1, 'Senior Data Analyst', 'We are looking for a Senior Data Analyst to join our Analytics team. You will analyze large datasets, build predictive models, and create visualizations that drive business decisions. The ideal candidate has strong SQL and Python skills with experience in BI tools.', '["Python","SQL","Tableau","Data Analysis"]', '["Power BI","Machine Learning","Statistics"]', 3, 8, 1500000, 2500000, 'Bangalore, India', 'full-time', 1, '{"difficulty":"medium","duration":45,"topics":["SQL","Python","Statistics"]}', '2026-07-01');

  insertJob.run(1, 'Full Stack Developer', 'Join our engineering team to build cutting-edge web applications. You will work with React, Node.js, and cloud technologies to deliver scalable solutions. Strong problem-solving skills and attention to detail are essential.', '["JavaScript","React","Node.js","SQL"]', '["TypeScript","AWS","Docker","GraphQL"]', 3, 7, 1800000, 3200000, 'Bangalore, India', 'full-time', 1, '{"difficulty":"hard","duration":60,"topics":["JavaScript","React","Node.js"]}', '2026-06-30');

  insertJob.run(2, 'DevOps Engineer', 'We need an experienced DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You will work with Kubernetes, Terraform, and AWS to ensure high availability and performance of our services.', '["Kubernetes","Docker","AWS","CI/CD"]', '["Terraform","Ansible","Python","Monitoring"]', 4, 10, 2000000, 3500000, 'Hyderabad, India', 'full-time', 1, '{"difficulty":"hard","duration":60,"topics":["Kubernetes","AWS","CI/CD"]}', '2026-07-15');

  insertJob.run(2, 'ML Engineer', 'Looking for an ML Engineer to design and deploy machine learning models at scale. You will work on NLP, recommendation systems, and predictive analytics. Experience with TensorFlow or PyTorch is required.', '["Python","TensorFlow","Machine Learning","NLP"]', '["PyTorch","MLOps","Kubernetes","Statistics"]', 3, 8, 2200000, 3800000, 'Remote', 'remote', 1, '{"difficulty":"hard","duration":60,"topics":["Machine Learning","Python","NLP"]}', '2026-07-20');

  insertJob.run(3, 'Backend Developer', 'Join DataFlow to build robust backend services powering our analytics platform. You will design and implement microservices, APIs, and database architectures using Java and Spring Boot.', '["Java","Spring Boot","Microservices","SQL"]', '["Kafka","Redis","Docker","PostgreSQL"]', 4, 10, 2000000, 3500000, 'Pune, India', 'full-time', 1, '{"difficulty":"medium","duration":45,"topics":["Java","Spring Boot","SQL"]}', '2026-06-25');

  insertJob.run(3, 'Frontend Developer', 'We are hiring a Frontend Developer to create beautiful, responsive user interfaces for our data visualization platform. You will work with React, TypeScript, and modern CSS to deliver exceptional user experiences.', '["React","JavaScript","CSS","TypeScript"]', '["Next.js","D3.js","Figma","Testing"]', 3, 7, 1400000, 2600000, 'Pune, India', 'full-time', 1, '{"difficulty":"medium","duration":45,"topics":["React","JavaScript","CSS"]}', '2026-07-10');

  insertJob.run(1, 'Cloud Architect', 'Lead the cloud architecture practice at TechNova. You will design multi-cloud solutions, establish best practices, and mentor a team of cloud engineers. Deep expertise in AWS and infrastructure as code is essential.', '["AWS","Cloud Architecture","Terraform","Kubernetes"]', '["Azure","GCP","Security","Cost Optimization"]', 8, 15, 3500000, 6000000, 'Bangalore, India', 'full-time', 1, '{"difficulty":"hard","duration":60,"topics":["AWS","Architecture","Terraform"]}', '2026-08-01');

  insertJob.run(2, 'Data Scientist', 'Join our data science team to build models that power our analytics products. You will work on predictive analytics, A/B testing, and statistical modeling using Python and machine learning frameworks.', '["Python","Machine Learning","Statistics","SQL"]', '["Deep Learning","Spark","R","NLP"]', 3, 8, 2000000, 3200000, 'Hyderabad, India', 'remote', 1, '{"difficulty":"medium","duration":45,"topics":["Python","Statistics","ML"]}', '2026-07-05');

  insertJob.run(3, 'React Native Developer', 'Build cross-platform mobile applications for our clients. You will use React Native to create performant, beautiful mobile experiences with seamless API integration.', '["React Native","JavaScript","Mobile Development","REST APIs"]', '["TypeScript","Redux","Firebase","Testing"]', 3, 6, 1600000, 2800000, 'Remote', 'remote', 1, '{"difficulty":"medium","duration":45,"topics":["React Native","JavaScript","Mobile"]}', '2026-07-25');

  insertJob.run(1, 'Product Manager - Tech', 'Lead product strategy for our enterprise SaaS platform. You will define roadmaps, work with engineering teams, and drive product-market fit. Strong technical background with data-driven decision making skills required.', '["Product Management","Data Analysis","Agile","SQL"]', '["Jira","A/B Testing","UX Design","Strategy"]', 5, 12, 2500000, 4500000, 'Bangalore, India', 'full-time', 0, null, '2026-07-30');

  // ── Applications ──
  const insertApp = db.prepare(`INSERT INTO applications (job_id, candidate_id, status, cover_letter, assessment_score, applied_at) VALUES (?, ?, ?, ?, ?, ?)`);

  insertApp.run(1, 1, 'assessment_completed', 'I am excited to apply for the Senior Data Analyst role. With 6 years of experience in data analytics at Flipkart and Amazon, I bring deep expertise in Python, SQL, and Tableau.', 88, '2026-05-15');
  insertApp.run(2, 2, 'shortlisted', 'As a full-stack developer with 5 years of experience at Razorpay, I am confident in my ability to contribute to your engineering team.', 85, '2026-05-16');
  insertApp.run(3, 3, 'assessment_completed', 'With 7 years in DevOps and current experience at Microsoft, I am well-equipped to manage your cloud infrastructure.', 94, '2026-05-14');
  insertApp.run(4, 4, 'assessment_pending', 'I am passionate about machine learning and have deployed multiple NLP models in production.', null, '2026-05-20');
  insertApp.run(5, 5, 'interview', 'With 8 years of Java development experience, including my current role at Goldman Sachs, I bring enterprise-grade engineering skills.', 91, '2026-05-12');
  insertApp.run(1, 7, 'applied', 'I would love to transition my data science skills into a data analyst role at TechNova.', null, '2026-05-22');
  insertApp.run(7, 8, 'offered', 'As a senior cloud architect at Google, I am excited about the opportunity to lead your cloud practice.', 97, '2026-05-10');
  insertApp.run(2, 6, 'assessment_pending', null, null, '2026-05-21');
  insertApp.run(6, 2, 'applied', 'I would like to apply for the Frontend Developer position. React is my primary expertise.', null, '2026-05-23');

  // ── Assessments ──
  const insertAssessment = db.prepare(`INSERT INTO assessments (application_id, job_id, candidate_id, questions, answers, score, total_time_seconds, max_time_seconds, proctoring_violations, proctoring_score, status, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const sampleQuestions = JSON.stringify([
    { id: 1, text: 'What is a LEFT JOIN in SQL?', type: 'mcq', options: ['Returns only matching rows', 'Returns all rows from left table and matching from right', 'Returns all rows from both tables', 'Returns only non-matching rows'], correct_answer: 1, difficulty: 'easy', skill: 'SQL', points: 5 },
    { id: 2, text: 'Write a Python function to find the moving average of a list.', type: 'coding', correct_answer: 'def moving_avg(lst, n):\n  return [sum(lst[i:i+n])/n for i in range(len(lst)-n+1)]', difficulty: 'medium', skill: 'Python', points: 10 },
    { id: 3, text: 'Explain the difference between OLTP and OLAP systems.', type: 'short_answer', correct_answer: 'OLTP handles transactional processing with normalized data, while OLAP handles analytical processing with denormalized data for complex queries.', difficulty: 'medium', skill: 'Data Analysis', points: 8 },
  ]);

  insertAssessment.run(1, 1, 1, sampleQuestions, JSON.stringify([1, 'def moving_avg(lst, n):\n  return [sum(lst[i:i+n])/n for i in range(len(lst)-n+1)]', 'OLTP is for transactions, OLAP for analytics']), 88, 2400, 2700, '[]', 100, 'completed', '2026-05-15T10:00:00', '2026-05-15T10:40:00');

  insertAssessment.run(3, 3, 3, sampleQuestions, JSON.stringify([1, 'correct answer', 'good answer']), 94, 2100, 3600, '[]', 98, 'completed', '2026-05-14T14:00:00', '2026-05-14T14:35:00');

  insertAssessment.run(5, 5, 5, sampleQuestions, JSON.stringify([1, 'correct', 'correct']), 91, 2700, 2700, '[]', 100, 'completed', '2026-05-12T09:00:00', '2026-05-12T09:45:00');

  insertAssessment.run(7, 7, 8, sampleQuestions, JSON.stringify([1, 'correct', 'perfect answer']), 97, 1800, 3600, '[]', 100, 'completed', '2026-05-10T11:00:00', '2026-05-10T11:30:00');

  // ── Manager Feedback ──
  const insertFeedback = db.prepare(`INSERT INTO manager_feedback (candidate_id, manager_name, manager_email, manager_title, company_name, relationship, worked_from, worked_to, overall_rating, technical_rating, communication_rating, leadership_rating, strengths, areas_of_improvement, would_rehire, comments, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  insertFeedback.run(1, 'Rajesh Mehta', 'rajesh.mehta@flipkart.com', 'Analytics Lead', 'Flipkart', 'direct_manager', '2020-06', '2022-12', 5, 5, 4, 4, 'Exceptional analytical skills. Priya consistently delivered insights that directly impacted business metrics. Her Python and SQL skills are outstanding.', 'Could take on more leadership responsibilities and mentor junior analysts.', 1, 'One of the best analysts I have worked with. Highly recommend.', 1, 'tok_priya_1');

  insertFeedback.run(3, 'Sarah Chen', 'sarah.chen@microsoft.com', 'Engineering Manager', 'Microsoft', 'direct_manager', '2020-01', '2024-12', 5, 5, 5, 5, 'Anjali is a rare talent. Her Kubernetes expertise is world-class. She automated our entire deployment pipeline and reduced downtime by 99%.', 'Nothing significant. She sets the bar for the team.', 1, 'Would hire again in a heartbeat. She transformed our DevOps culture.', 1, 'tok_anjali_1');

  insertFeedback.run(5, 'Mike Johnson', 'mike.j@goldmansachs.com', 'VP Engineering', 'Goldman Sachs', 'direct_manager', '2020-01', '2024-12', 5, 5, 4, 4, 'Neha is an exceptional backend engineer. Her Java microservices handle millions of transactions with 99.99% uptime. Incredible problem solver.', 'Could improve on cross-team communication and documentation.', 1, 'Top-tier engineering talent. She elevated our entire backend architecture.', 1, 'tok_neha_1');

  insertFeedback.run(8, 'Lisa Wang', 'lisa.wang@google.com', 'Director of Cloud Engineering', 'Google', 'direct_manager', '2018-07', '2024-12', 5, 5, 5, 5, 'Amit is the best cloud architect I have ever worked with. His multi-cloud designs have saved our clients millions while improving reliability.', 'He could benefit from more public speaking and thought leadership.', 1, 'A generational talent in cloud architecture. Any company would be lucky to have him.', 1, 'tok_amit_1');

  console.log('🌱 Database seeded with demo data');
}
