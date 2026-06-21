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
            Welcome to the future of hiring
          </div>
          <h1 className="hero__title animate-fade-in-up">
            This is <span className="text-gradient">Switchera</span> <br />
            Where Merit Wins.
          </h1>
          <p className="hero__subtitle animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Switchera isn't just another job board. We are a unified hiring ecosystem that replaces traditional resumes with verified skills, rigorous assessments, and multi-level validations to connect top-tier professionals directly with trusted employers.
          </p>
          <div className="hero__actions animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="hero__btn hero__btn--primary">
                  <span>Get Started Now</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                <Link to="/login" className="hero__btn hero__btn--secondary">
                  Sign In
                </Link>
              </>
            ) : (
              <Link to={isCandidate ? '/candidate/dashboard' : '/employer/dashboard'} className="hero__btn hero__btn--primary">
                Go to Dashboard →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* The Idea / Why Switchera is Good */}
      <section className="how-it-works reveal" style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-12) 0' }}>
        <div className="container">
          <h2 className="section__title">The Idea Behind Switchera</h2>
          <p className="section__subtitle">Why the old way of hiring is broken, and how we fix it.</p>
          
          <div className="features__grid" style={{ marginTop: 'var(--space-8)' }}>
            <div className="feature-card feature-card--primary">
              <div className="feature-card__icon">📝</div>
              <div className="feature-card__content">
                <h3 className="feature-card__title">Resumes Are Dead</h3>
                <p className="feature-card__desc">Traditional resumes are full of exaggerations and keywords meant to trick ATS bots. Switchera bypasses the resume by testing actual skills in real-time. If you have the skill, you get the job.</p>
              </div>
            </div>
            
            <div className="feature-card feature-card--secondary">
              <div className="feature-card__icon">🛡️</div>
              <div className="feature-card__content">
                <h3 className="feature-card__title">Verified Integrity</h3>
                <p className="feature-card__desc">Employers waste thousands of hours interviewing candidates who don't actually know the tech stack. Switchera candidates are pre-vetted through strict L1/L2 proctored interviews before employers ever see them.</p>
              </div>
            </div>

            <div className="feature-card feature-card--accent">
              <div className="feature-card__icon">⚖️</div>
              <div className="feature-card__content">
                <h3 className="feature-card__title">True Meritocracy</h3>
                <p className="feature-card__desc">It doesn't matter what school you went to or who you know. Switchera ranks candidates purely based on their verified assessment scores and technical ability. Pure, unadulterated merit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Founder */}
      <section className="reveal" style={{ padding: 'var(--space-12) 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: 'var(--space-8)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            
            <div style={{ flex: '1 1 300px', maxWidth: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <img src="/founder.jpg" alt="Nishal Singh - Founder of Switchera" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
            </div>

            <div style={{ flex: '2 1 400px' }}>
              <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(45,121,242,0.1)', color: 'var(--color-primary-400)', borderRadius: '100px', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                MEET THE FOUNDER
              </div>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Nishal Singh</h2>
              <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>Founder & CEO, Switchera</p>
              
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
                "I built Switchera because I saw firsthand how inefficient, biased, and exhausting the global hiring market had become. Great engineers were being rejected by automated resume scanners, and companies were drowning in thousands of unqualified applications."
              </p>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-6)' }}>
                "Switchera changes everything. We've built an ecosystem where your skills speak louder than your CV. We verify credentials, proctor skill assessments, and conduct technical interviews up-front so that when a candidate reaches an employer, the only question left is 'When can you start?'"
              </p>

              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <a href="https://www.linkedin.com/company/switchera-in/" target="_blank" rel="noopener noreferrer" className="btn btn--secondary">
                  LinkedIn
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Reddit coming soon!'); }} className="btn btn--secondary">
                  Reddit
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Office: 123 Switchera Lane, Tech City\\nPhone: +1 (555) 000-0000'); }} className="btn btn--secondary">
                  Contact Info
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta reveal">
        <div className="container">
          <div className="cta__card">
            <div className="cta__orb" />
            <h2 className="cta__title">Ready to Join Switchera?</h2>
            <p className="cta__desc">Join thousands of companies and professionals who trust our ecosystem for verified, merit-based hiring.</p>
            <div className="cta__actions">
              <Link to="/register" className="hero__btn hero__btn--primary">
                Create Your Account →
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
                <div style={{ width: 'auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo.png" alt="Switchera" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <span className="navbar__brand-text">Switchera</span>
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
            <p>© {new Date().getFullYear()} Switchera. All rights reserved. Built with integrity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
