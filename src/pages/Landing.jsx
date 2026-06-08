import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const { isAuthenticated, isCandidate } = useAuth();
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
          <div className="hero__grid" />
        </div>
        <div className="hero__content container">
          <div className="hero__badge animate-fade-in-down">
            <span className="hero__badge-dot" />
            Trusted by 10,000+ Companies Worldwide
          </div>
          <h1 className="hero__title animate-fade-in-up">
            Where <span className="text-gradient">Verified Talent</span> Meets{' '}
            <span className="text-gradient-accent">Trusted Employers</span>
          </h1>
          <p className="hero__subtitle animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            The only hiring platform that verifies every credential, tests every skill with AI-powered assessments,
            and protects companies from fake profiles. No more guessing — hire with confidence.
          </p>
          <div className="hero__actions animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="hero__btn hero__btn--primary">
                  <span>Get Started Free</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                <Link to="/login" className="hero__btn hero__btn--secondary">
                  Sign In
                </Link>
                <button 
                  onClick={() => {
                    import('../api/client').then(({ default: api }) => api.trackAnalytics('app_download', '/download'));
                    alert('Thanks for downloading the TrueHire app!');
                  }}
                  className="hero__btn hero__btn--secondary" style={{ borderColor: '#10b981', color: '#10b981' }}>
                  📱 Download App
                </button>
              </>
            ) : (
              <Link to={isCandidate ? '/candidate/dashboard' : '/employer/dashboard'} className="hero__btn hero__btn--primary">
                Go to Dashboard →
              </Link>
            )}
          </div>
          <div className="hero__trust animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="hero__avatars">
              {['PS', 'RK', 'AP', 'VS', 'NG'].map((init, i) => (
                <div key={i} className="hero__avatar" style={{ animationDelay: `${i * 0.05}s` }}>{init}</div>
              ))}
            </div>
            <span className="hero__trust-text">Join 50,000+ verified professionals</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats reveal">
        <div className="container">
          <div className="stats__grid">
            {[
              { value: '50K+', label: 'Verified Professionals', icon: '👤' },
              { value: '10K+', label: 'Trusted Companies', icon: '🏢' },
              { value: '98%', label: 'Verification Accuracy', icon: '✅' },
              { value: '85%', label: 'Successful Hire Rate', icon: '🎯' },
            ].map((stat, i) => (
              <div key={i} className="stats__card" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="stats__icon">{stat.icon}</span>
                <span className="stats__value">{stat.value}</span>
                <span className="stats__label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works reveal">
        <div className="container">
          <h2 className="section__title">How TrueHire Works</h2>
          <p className="section__subtitle">Three simple steps to verified hiring</p>
          <div className="steps">
            {[
              { step: '01', icon: '📋', title: 'Build & Verify Profile', desc: 'Create your professional profile with education, experience, and skills. Our verification system validates everything — degrees, past employment, certifications.' },
              { step: '02', icon: '🧠', title: 'Take AI Assessment', desc: 'Complete skill-specific assessments generated by AI. Face detection and tab monitoring ensure integrity. No cheating, no shortcuts — just real skills.' },
              { step: '03', icon: '🚀', title: 'Get Hired with Confidence', desc: 'Employers see your verified profile, assessment scores, and optional manager feedback. Land your dream job based on proven merit.' },
            ].map((item, i) => (
              <div key={i} className="step-card" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="step-card__number">{item.step}</div>
                <div className="step-card__icon">{item.icon}</div>
                <h3 className="step-card__title">{item.title}</h3>
                <p className="step-card__desc">{item.desc}</p>
                {i < 2 && <div className="step-card__connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features reveal">
        <div className="container">
          <h2 className="section__title">Why TrueHire is Different</h2>
          <p className="section__subtitle">End-to-end verification that traditional job boards can't match</p>
          <div className="features__grid">
            {[
              { icon: '🛡️', title: 'Credential Verification', desc: 'Every degree, certification, and work experience is verified against official records. No more fake resumes slipping through.', color: 'primary' },
              { icon: '🤖', title: 'AI-Powered Assessments', desc: 'Dynamic tests tailored to each job\'s requirements. Questions are generated based on required skills and difficulty levels.', color: 'secondary' },
              { icon: '👁️', title: 'Anti-Cheat Proctoring', desc: 'Real-time face detection, tab-switch monitoring, and screen activity tracking. Every assessment maintains full integrity.', color: 'accent' },
              { icon: '💬', title: 'Manager Feedback', desc: 'Optional endorsements from past managers add credibility. Transparent reviews visible to potential employers.', tag: 'Optional', color: 'warning' },
              { icon: '⚡', title: 'Minimum 3 Years Experience', desc: 'Exclusively for experienced professionals. No entry-level noise — only proven talent with real industry experience.', color: 'danger' },
              { icon: '📊', title: 'Skill Match Scoring', desc: 'Our algorithms calculate skill match percentages between candidates and jobs, ensuring the best fit for both parties.', color: 'success' },
            ].map((feature, i) => (
              <div key={i} className={`feature-card feature-card--${feature.color}`}>
                <div className="feature-card__icon">{feature.icon}</div>
                <div className="feature-card__content">
                  <h3 className="feature-card__title">
                    {feature.title}
                    {feature.tag && <span className="feature-card__tag">{feature.tag}</span>}
                  </h3>
                  <p className="feature-card__desc">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta reveal">
        <div className="container">
          <div className="cta__card">
            <div className="cta__orb" />
            <h2 className="cta__title">Ready to Hire With Confidence?</h2>
            <p className="cta__desc">Join thousands of companies and professionals who trust TrueHire for verified, merit-based hiring.</p>
            <div className="cta__actions">
              <Link to="/register" className="hero__btn hero__btn--primary">
                Start Hiring Now →
              </Link>
              <Link to="/register" className="hero__btn hero__btn--secondary">
                Find Verified Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <div className="navbar__brand">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="url(#logo-grad2)" />
                  <path d="M8 16L13 21L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <defs><linearGradient id="logo-grad2" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#2d79f2" /><stop offset="1" stopColor="#8b2dff" /></linearGradient></defs>
                </svg>
                <span className="navbar__brand-text">TrueHire</span>
              </div>
              <p className="footer__tagline">Where verified talent meets trusted employers.</p>
            </div>
            <div className="footer__links">
              <h4>For Candidates</h4>
              <Link to="/register">Create Profile</Link>
              <Link to="/register">Browse Jobs</Link>
              <Link to="/register">Skill Assessments</Link>
            </div>
            <div className="footer__links">
              <h4>For Employers</h4>
              <Link to="/register">Post a Job</Link>
              <Link to="/register">Browse Talent</Link>
              <Link to="/register">Pricing</Link>
            </div>
            <div className="footer__links">
              <h4>Company</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('About Us page coming soon!'); }}>About Us</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Contact page coming soon!'); }}>Contact</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Privacy Policy coming soon!'); }}>Privacy Policy</a>
            </div>
          </div>
          <div className="footer__bottom">
            <p>© 2026 TrueHire. All rights reserved. Built with integrity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
