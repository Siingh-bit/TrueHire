import { useState } from 'react';

/**
 * Reusable share control.
 * - On devices that support the native share sheet (most phones), the first
 *   option opens it — giving Instagram, WhatsApp, Messages, etc.
 * - Everywhere, an explicit menu offers WhatsApp, Facebook, X, LinkedIn,
 *   Telegram, Email and Copy link.
 */
export default function ShareButton({ url, title = 'Switchera', text = '', className = 'btn btn--secondary', label = 'Share' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || title;
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const enc = encodeURIComponent;
  const links = {
    whatsapp: `https://wa.me/?text=${enc(shareText + ' ' + shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`,
    x: `https://twitter.com/intent/tweet?url=${enc(shareUrl)}&text=${enc(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`,
    telegram: `https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(shareText)}`,
    email: `mailto:?subject=${enc(title)}&body=${enc(shareText + '\n\n' + shareUrl)}`,
  };

  const nativeShare = async () => {
    try { await navigator.share({ title, text: shareText, url: shareUrl }); setOpen(false); }
    catch (_) { /* user cancelled */ }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch (_) {}
  };

  const openLink = (href) => { window.open(href, '_blank', 'noopener,noreferrer'); setOpen(false); };

  const item = {
    display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%',
    padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)', background: 'none', border: 'none',
    textAlign: 'left', cursor: 'pointer', textDecoration: 'none',
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" className={className} onClick={() => setOpen(o => !o)} aria-haspopup="true" aria-expanded={open}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}><path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8M16 6l-4-4-4 4M12 2v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {label}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, width: 230,
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-secondary)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: '4px',
          }}>
            {canNativeShare && (
              <button type="button" style={{ ...item, color: 'var(--color-primary-400)', fontWeight: 600 }} onClick={nativeShare}>
                📲 More apps (Instagram, Messages…)
              </button>
            )}
            <button type="button" style={item} onClick={() => openLink(links.whatsapp)}>🟢 WhatsApp</button>
            <button type="button" style={item} onClick={() => openLink(links.facebook)}>🔵 Facebook</button>
            <button type="button" style={item} onClick={() => openLink(links.x)}>✖️ X (Twitter)</button>
            <button type="button" style={item} onClick={() => openLink(links.linkedin)}>💼 LinkedIn</button>
            <button type="button" style={item} onClick={() => openLink(links.telegram)}>✈️ Telegram</button>
            <a style={item} href={links.email}>✉️ Email</a>
            <button type="button" style={{ ...item, borderTop: '1px solid var(--color-border-primary)' }} onClick={copyLink}>
              {copied ? '✅ Link copied!' : '🔗 Copy link'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
