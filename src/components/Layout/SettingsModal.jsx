import { useTheme } from '../../context/ThemeContext';
import '../../styles/dashboard.css';

export default function SettingsModal({ onClose }) {
  const { themeMode, setThemeMode, themeColor, setThemeColor } = useTheme();

  const colors = [
    { id: 'blue', label: 'Navy Blue', hex: '#2d79f2' },
    { id: 'purple', label: 'Purple', hex: '#a855f7' },
    { id: 'green', label: 'Green', hex: '#22c55e' },
    { id: 'teal', label: 'Teal', hex: '#14b8a6' },
    { id: 'orange', label: 'Orange', hex: '#f97316' },
    { id: 'red', label: 'Red', hex: '#ef4444' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 'var(--z-modal-overlay)' }}>
      <div className="modal glass-card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', padding: 'var(--space-6)', zIndex: 'var(--z-modal)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h3>Settings & Appearance</h3>
          <button onClick={onClose} style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h5 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>Theme Mode</h5>
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
          <h5 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>Accent Color</h5>
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
