import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import '../../styles/dashboard.css';

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
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard__header">
        <h1 className="dashboard__welcome">Interview <span>Availability</span> 🗓️</h1>
        <p className="dashboard__subtitle">Manage your available time slots for Level 1 & Level 2 interviews</p>
      </div>

      {message && <div className="toast toast--success">{message}</div>}

      <div className="card page-section">
        <h3 className="card__header">➕ Add Availability Slot</h3>
        <form onSubmit={handleAdd} className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" className="form-control" value={newDate} onChange={e => setNewDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Time Slot</label>
            <select className="form-control" value={newSlot} onChange={e => setNewSlot(e.target.value)}>
              {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <input type="text" className="form-control" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="e.g. Prefer video call" />
          </div>
          <div className="form-group">
            <label className="sr-only">Submit</label>
            <button type="submit" disabled={saving} className="btn btn--primary">
              {saving ? 'Adding...' : '+ Add Slot'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="card__header">📋 Your Available Slots ({slots.length})</h3>
        {loading ? <p className="empty-state__desc">Loading...</p> : slots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📭</div>
            <div className="empty-state__title">No availability slots</div>
            <div className="empty-state__desc">Add your first slot above to get started</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {slots.map(slot => (
              <div key={slot.id} className="availability-slot">
                <div className="availability-slot__info">
                  <span className="availability-slot__date">{new Date(slot.available_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="availability-slot__dot">•</span>
                  <span className="availability-slot__time">{TIME_SLOTS.find(s => s.value === slot.time_slot)?.label || slot.time_slot}</span>
                  {slot.notes && <span className="availability-slot__notes">— {slot.notes}</span>}
                </div>
                <button onClick={() => handleDelete(slot.id)} className="btn btn--danger btn--sm">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
