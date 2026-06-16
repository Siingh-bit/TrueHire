import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import './Assessment.css';

export default function TakeAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('loading'); // loading, ready, in_progress, submitting, done
  const [timeLeft, setTimeLeft] = useState(0);
  const [violations, setViolations] = useState([]);
  const [faceDetected, setFaceDetected] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Load assessment
  useEffect(() => {
    api.getAssessment(id).then(res => {
      const data = res.data;
      setAssessment(data);
      setTimeLeft(data.max_time_seconds || 2700);
      if (data.status === 'in_progress') {
        setStatus('in_progress');
        const elapsed = Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000);
        setTimeLeft(Math.max(0, (data.max_time_seconds || 2700) - elapsed));
      } else if (data.status === 'completed' || data.status === 'flagged') {
        navigate(`/assessment/${id}/results`);
      } else {
        setStatus('ready');
      }
    }).catch(err => { console.error(err); navigate('/candidate/applications'); });
  }, [id]);

  // Timer
  useEffect(() => {
    if (status === 'in_progress') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { handleSubmit(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // Tab/visibility detection
  useEffect(() => {
    if (status !== 'in_progress') return;

    const handleVisibility = () => {
      if (document.hidden) {
        logViolation('tab_switch', 'high', 'Candidate switched tabs');
      }
    };

    const handleBlur = () => {
      logViolation('window_blur', 'medium', 'Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [status]);

  const [stream, setStream] = useState(null);

  // Camera setup
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 200, height: 150 },
        audio: true 
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      // We will bind it in a useEffect because videoRef might not be mounted yet
    } catch (err) {
      console.warn('Camera not available:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setStream(null);
    }
  };

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('Video play failed:', e));
    }
  }, [status, stream]);

  useEffect(() => { return () => stopCamera(); }, []);

  const logViolation = useCallback(async (type, severity, description) => {
    const violation = { type, severity, description };
    setViolations(prev => [...prev, violation]);
    try { await api.logViolation(id, violation); } catch (err) { console.error(err); }
  }, [id]);

  const startAssessment = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 200, height: 150 },
        audio: true 
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      alert('⚠️ Camera and Microphone access is REQUIRED to take this assessment. Please allow access in your browser settings and try again.');
      return;
    }
    await api.startAssessment(id);
    setStatus('in_progress');
  };

  const handleSubmit = async () => {
    setStatus('submitting');
    clearInterval(timerRef.current);
    stopCamera();
    try {
      const answersArray = assessment.questions.map((_, i) => answers[i] ?? null);
      await api.submitAssessment(id, answersArray);
      navigate(`/assessment/${id}/results`);
    } catch (err) {
      console.error(err);
      setStatus('in_progress');
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (status === 'loading') return <div className="assessment-fullscreen"><div className="page-loader"><div className="spinner" /></div></div>;

  if (status === 'ready') {
    return (
      <div className="assessment-fullscreen">
        <div className="assessment-start">
          <div className="assessment-start__icon">🧠</div>
          <h1 className="assessment-start__title">AI Skill Assessment</h1>
          <p className="assessment-start__desc">You're about to take a proctored skill assessment. Please read the rules carefully.</p>

          <div className="assessment-rules">
            <h3>📋 Assessment Rules</h3>
            <ul>
              <li>⏰ Time Limit: <strong>{Math.floor((assessment?.max_time_seconds || 2700) / 60)} minutes</strong></li>
              <li>📷 Your camera will be active for face detection monitoring</li>
              <li>🚫 Do NOT switch tabs or windows — violations are tracked</li>
              <li>🖥️ Stay in fullscreen mode throughout the assessment</li>
              <li>📝 {assessment?.questions?.length || 15} questions covering required job skills</li>
              <li>⚠️ Multiple violations will flag your assessment for review</li>
            </ul>
          </div>

          <div className="assessment-start__actions">
            <button className="btn btn--primary btn--lg" onClick={startAssessment}>Start Assessment →</button>
            <button className="btn btn--secondary" onClick={() => navigate('/candidate/applications')}>← Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const q = assessment?.questions?.[current];
  const progress = ((current + 1) / (assessment?.questions?.length || 1)) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="assessment-fullscreen">
      {/* Top bar */}
      <div className="assessment-topbar">
        <div className="assessment-topbar__left">
          <span className="assessment-topbar__logo">🧠 Switchera Assessment</span>
          <span className="assessment-topbar__progress">Q{current + 1}/{assessment?.questions?.length}</span>
        </div>
        <div className="assessment-topbar__center">
          <div className="assessment-timer" style={{ color: timeLeft < 300 ? 'var(--color-danger-400)' : 'var(--color-text-primary)' }}>
            ⏰ {formatTime(timeLeft)}
          </div>
        </div>
        <div className="assessment-topbar__right">
          <div className="assessment-face" style={{ borderColor: faceDetected ? 'var(--color-accent-500)' : 'var(--color-danger-500)' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
          </div>
          {violations.length > 0 && <span className="badge badge--danger">⚠ {violations.length}</span>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="assessment-progressbar">
        <div className="assessment-progressbar__fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="assessment-content">
        {q && (
          <div className="assessment-question animate-fade-in-up" key={current}>
            <div className="assessment-question__header">
              <span className={`badge badge--${q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'accent'}`}>
                {q.difficulty} · {q.points} pts
              </span>
              <span className="skill-tag">{q.skill}</span>
            </div>
            <h2 className="assessment-question__text">{q.text}</h2>

            {q.type === 'mcq' && (
              <div className="assessment-options">
                {q.options?.map((opt, i) => (
                  <button key={i} className={`assessment-option ${answers[current] === i ? 'assessment-option--selected' : ''}`} onClick={() => setAnswers({...answers, [current]: i})}>
                    <span className="assessment-option__letter">{String.fromCharCode(65 + i)}</span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {(q.type === 'coding' || q.type === 'short_answer') && (
              <textarea className="assessment-textarea" rows={q.type === 'coding' ? 10 : 5} placeholder={q.type === 'coding' ? 'Write your code here...' : 'Type your answer here...'} value={answers[current] || ''} onChange={e => setAnswers({...answers, [current]: e.target.value})} spellCheck={q.type !== 'coding'} style={q.type === 'coding' ? { fontFamily: 'monospace' } : {}} />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="assessment-nav">
          <button className="btn btn--secondary" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>← Previous</button>
          <div className="assessment-dots">
            {assessment?.questions?.map((_, i) => (
              <button key={i} className={`assessment-dot ${i === current ? 'assessment-dot--current' : ''} ${answers[i] !== undefined ? 'assessment-dot--answered' : ''}`} onClick={() => setCurrent(i)} title={`Question ${i + 1}`} />
            ))}
          </div>
          {current < (assessment?.questions?.length || 0) - 1 ? (
            <button className="btn btn--primary" onClick={() => setCurrent(current + 1)}>Next →</button>
          ) : (
            <button className="btn btn--primary" onClick={handleSubmit} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Submitting...' : `Submit (${answeredCount}/${assessment?.questions?.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
