import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import '../../styles/dashboard.css';
import './Assessment.css';

export default function Results() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAssessment(id).then(res => setAssessment(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="dashboard"><div className="page-loader"><div className="spinner" /></div></div>;
  if (!assessment) return null;

  const score = assessment.score || 0;
  const grade = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
  const gradeLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Improvement';
  const timeMin = Math.floor((assessment.total_time_seconds || 0) / 60);
  const timeSec = (assessment.total_time_seconds || 0) % 60;
  const violations = assessment.proctoring_violations || [];

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="results-page">
        <div className="results-hero">
          <span style={{ fontSize: '3rem' }}>{score >= 70 ? '🎉' : score >= 50 ? '👍' : '📝'}</span>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 'var(--space-3) 0 var(--space-1)' }}>Assessment Complete</h1>
          <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>Here's how you performed</p>
          <div className={`results-score results-score--${grade}`}>{score}%</div>
          <div style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)' }}>{gradeLabel}</div>
        </div>

        <div className="results-grid">
          <div className="stat-card">
            <div className="stat-card__label">Time Taken</div>
            <div className="stat-card__value stat-card__value--primary">{timeMin}m {timeSec}s</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Proctoring Score</div>
            <div className={`stat-card__value ${assessment.proctoring_score >= 80 ? 'stat-card__value--accent' : 'stat-card__value--warning'}`}>{assessment.proctoring_score}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Violations</div>
            <div className={`stat-card__value ${violations.length === 0 ? 'stat-card__value--accent' : 'stat-card__value--danger'}`}>{violations.length}</div>
          </div>
        </div>

        {violations.length > 0 && (
          <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-danger-400)' }}>⚠️ Proctoring Violations</h3>
            {violations.map((v, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: i < violations.length - 1 ? '1px solid var(--color-border-primary)' : 'none', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{v.description || v.type}</span>
                <span className={`badge badge--${v.severity === 'high' ? 'danger' : 'warning'}`}>{v.severity}</span>
              </div>
            ))}
          </div>
        )}

        {/* Question breakdown */}
        {assessment.questions && (
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>📋 Question Breakdown</h3>
            {assessment.questions.map((q, i) => {
              const answer = assessment.answers?.[i];
              const isCorrect = q.type === 'mcq' ? answer === q.correct_answer : (answer && answer.length > 20);
              return (
                <div key={i} style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '2px' }}>Q{i + 1}: {q.text.substring(0, 80)}{q.text.length > 80 ? '...' : ''}</div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <span className="skill-tag" style={{ fontSize: '10px' }}>{q.skill}</span>
                        <span className={`badge badge--${q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'accent'}`}>{q.difficulty}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 'var(--font-size-lg)', flexShrink: 0 }}>{isCorrect ? '✅' : answer != null ? '❌' : '⏭️'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
          <Link to="/candidate/applications" className="btn btn--primary btn--lg">← Back to Applications</Link>
        </div>
      </div>
    </div>
  );
}
