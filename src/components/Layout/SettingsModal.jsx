import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import '../../styles/dashboard.css';

export default function SettingsModal({ onClose }) {
  const { themeMode, setThemeMode, themeColor, setThemeColor } = useTheme();
  const { user, profile, refreshProfile } = useAuth();

  const currentName = profile?.full_name || profile?.company_name || '';
  const nameLabel = user?.role === 'employer' ? 'Company Name' : 'Full Name';

  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(user?.email || '');
  const [emailPwd, setEmailPwd] = useState('');
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const saveName = async () => {
    if (!name.trim()) return flash('err', 'Name cannot be empty');
    setBusy('name');
    try { await api.updateName(name.trim()); await refreshProfile(); flash('ok', 'Name updated.'); }
    catch (e) { flash('err', e.message); } finally { setBusy(''); }
  };

  const saveEmail = async () => {
    if (!email.trim() || !emailPwd) return flash('err', 'Enter the new email and your current password.');
    setBusy('email');
    try { await api.updateEmail(email.trim(), emailPwd); await refreshProfile(); setEmailPwd(''); flash('ok', 'Email updated.'); }
    catch (e) { flash('err', e.message); } finally { setBusy(''); }
  };

  const savePassword = async () => {
    if (newPwd.length < 6) return flash('err', 'New password must be at least 6 characters.');
    if (newPwd !== confirmPwd) return flash('err', 'New passwords do not match.');
    setBusy('pwd');
    try { await api.changePassword(curPwd, newPwd); setCurPwd(''); setNewPwd(''); setConfirmPwd(''); flash('ok', 'Password changed.'); }
    catch (e) { flash('err', e.message); } finally { setBusy(''); }
  };

  const field = { width: '100%', padding: 'var(--space-3)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)' };
  const fieldLabel = { display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-1)', marginTop: 'var(--space-3)' };
  const sectionTitle = { marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' };

  const colors = [
    { id: 'blue', label: 'Navy Blue', hex: '#12a866' },
    { id: 'purple', label: 'Purple', hex: '#a855f7' },
    { id: 'green', label: 'Green', hex: '#22c55e' },
    { id: 'teal', label: 'Teal', hex: '#14b8a6' },
    { id: 'orange', label: 'Orange', hex: '#f97316' },
    { id: 'red', label: 'Red', hex: '#ef4444' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 'var(--z-modal-overlay)' }}>
      <div className="modal glass-card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', padding: 'var(--space-6)', zIndex: 'var(--z-modal)', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h3>Settings</h3>
          <button onClick={onClose} style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        {msg && (
          <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)',
            background: msg.type === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: msg.type === 'ok' ? 'var(--color-success-400)' : 'var(--color-danger-400)' }}>
            {msg.text}
          </div>
        )}

        {user && (
          <>
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h5 style={sectionTitle}>Account</h5>

              <label style={fieldLabel}>{nameLabel}</label>
              <input style={field} value={name} onChange={e => setName(e.target.value)} placeholder={nameLabel} />
              <button className="btn btn--secondary" onClick={saveName} disabled={busy === 'name'}>{busy === 'name' ? 'Saving…' : 'Save Name'}</button>

              <label style={fieldLabel}>Email Address</label>
              <input style={field} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              <input style={field} type="password" value={emailPwd} onChange={e => setEmailPwd(e.target.value)} placeholder="Current password (to confirm)" />
              <button className="btn btn--secondary" onClick={saveEmail} disabled={busy === 'email'}>{busy === 'email' ? 'Saving…' : 'Update Email'}</button>

              <label style={fieldLabel}>Change Password</label>
              <input style={field} type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} placeholder="Current password" />
              <input style={field} type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New password (min 6 chars)" />
              <input style={field} type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirm new password" />
              <button className="btn btn--secondary" onClick={savePassword} disabled={busy === 'pwd'}>{busy === 'pwd' ? 'Saving…' : 'Change Password'}</button>
            </div>
            <div style={{ height: '1px', background: 'var(--color-border-secondary)', margin: 'var(--space-2) 0 var(--space-6)' }} />
          </>
        )}

        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h5 style={sectionTitle}>Theme Mode</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <button
              className={`btn ${themeMode === 'light' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setThemeMode('light')}
              style={{ transition: 'all var(--transition-base)' }}
            >
              ☀️ Light Mode
            </button>
            <button
              className={`btn ${themeMode === 'dark' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setThemeMode('dark')}
              style={{ transition: 'all var(--transition-base)' }}
            >
              🌙 Dark Mode
            </button>
          </div>
        </div>

        <div>
          <h5 style={sectionTitle}>Accent Color</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            {colors.map(c => (
              <button
                key={c.id}
                onClick={() => setThemeColor(c.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  background: themeColor === c.id ? 'var(--color-bg-elevated)' : 'transparent',
                  border: `2px solid ${themeColor === c.id ? 'var(--color-border-focus)' : 'var(--color-border-secondary)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.hex, boxShadow: themeColor === c.id ? 'var(--shadow-glow-primary)' : 'none' }} />
                <span style={{ fontSize: 'var(--font-size-sm)', color: themeColor === c.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
