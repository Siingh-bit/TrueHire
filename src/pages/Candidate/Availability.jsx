import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import './Dashboard.css';

const TIME_SLOTS = [
  { value: 'before_work', label: '🌅 Before Work (7AM-9AM)' },
  { value: 'after_work', label: '🌆 After Work (6PM-9PM)' },
  { value: 'weekend_morning', label: '☀️ Weekend Morning (9AM-12PM)' },
  { value: 'weekend_afternoon', label: '🌤️ Weekend Afternoon (1PM-5PM)' },
];

export default function Availability() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('before_work');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadSlots = async () => {
    try {
      const res = await api.getAvailability();
      if (res.success) setSlots(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadSlots(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDate) return;
    setSaving(true);
    try {
      await api.addAvailability({ available_date: newDate, time_slot: newSlot, notes: newNotes });
      setNewDate(''); setNewNotes('');
      setMessage('Slot added!');
      loadSlots();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteAvailability(id);
      loadSlots();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Interview Availability</h1>
        <p className="dashboard__subtitle">Manage your available time slots for Level 1 & Level 2 interviews</p>
      </div>

      {message && <div style={{ padding: '12px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '8px', marginBottom: '16px' }}>{message}</div>}

      <div className="dashboard__card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>Add Availability Slot</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '6px' }}>Date</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.95rem' }} />
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '6px' }}>Time Slot</label>
            <select value={newSlot} onChange={e => setNewSlot(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
              {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '6px' }}>Notes (optional)</label>
            <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="e.g. Prefer video call"
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.95rem' }} />
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: 'var(--gradient-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', height: '42px' }}>
            {saving ? 'Adding...' : '+ Add Slot'}
          </button>
        </form>
      </div>

      <div className="dashboard__card">
        <h3 style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>Your Available Slots ({slots.length})</h3>
        {loading ? <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p> : slots.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No availability slots added yet. Add your first slot above.</p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {slots.map(slot => (
              <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                <div>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{new Date(slot.available_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span style={{ color: 'var(--color-primary-400)', margin: '0 12px' }}>•</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{TIME_SLOTS.find(s => s.value === slot.time_slot)?.label || slot.time_slot}</span>
                  {slot.notes && <span style={{ color: 'var(--color-text-tertiary)', marginLeft: '12px', fontSize: '0.85rem' }}>— {slot.notes}</span>}
                </div>
                <button onClick={() => handleDelete(slot.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
