import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import './MessagePanel.css';

export default function MessagePanel({ applicationId, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchMessages = () => {
    api.request(`/api/messages/${applicationId}`).then(res => {
      if (res.success) {
        setMessages(res.data || []);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [applicationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      const res = await api.request(`/api/messages/${applicationId}`, {
        method: 'POST',
        body: JSON.stringify({ content: input })
      });
      if (res.success) {
        setInput('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="message-panel animate-slide-in-up">
      <div className="message-panel__header">
        <h3>💬 Direct Messages</h3>
        <button className="message-panel__close" onClick={onClose}>×</button>
      </div>
      <div className="message-panel__body">
        {loading && messages.length === 0 ? (
          <div className="message-panel__loading"><span className="spinner-sm" /></div>
        ) : messages.length === 0 ? (
          <div className="message-panel__empty">No messages yet. Say hello!</div>
        ) : (
          messages.map(m => {
            const isMe = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`message ${isMe ? 'message--mine' : 'message--theirs'}`}>
                {!isMe && <div className="message__sender">{m.sender_name} <span className="message__role">{m.sender_role}</span></div>}
                <div className="message__bubble">{m.content}</div>
                <div className="message__time">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="message-panel__input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Type a message..." 
          className="form-control"
        />
        <button type="submit" className="btn btn--primary" disabled={!input.trim()}>Send</button>
      </form>
    </div>
  );
}
