import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MemberSearch from './MemberSearch';
import CommentThread from './CommentThread';

export default function SharedTaskCard({ task, onUpdate, onDelete }) {
  const { user, API } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    due: toInputDate(task.due),
    priority: task.priority || 'low',
    category: task.category || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isOwner = task.owner.userId === user?.userId || task.owner.userId?.toString() === user?.userId?.toString();
  const allMemberIds = [task.owner.userId?.toString(), ...task.members.map((m) => m.userId?.toString())];

  function toInputDate(due) {
    if (!due) return '';
    const [m, d, y] = due.split('/');
    if (!m || !d || !y) return '';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  function fromInputDate(val) {
    if (!val) return '';
    const [y, m, d] = val.split('-');
    return `${m}/${d}/${y}`;
  }

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    try {
      const res = await axios.patch(`${API}/api/shared-tasks/${task._id}`, { ...form, due: fromInputDate(form.due) });
      onUpdate(res.data);
      setEditing(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleToggleComplete = async () => {
    try {
      const res = await axios.patch(`${API}/api/shared-tasks/${task._id}`, { completed: !task.completed });
      onUpdate(res.data);
    } catch (err) { alert('Failed to update.'); }
  };

  const handleAddMember = async (selectedUser) => {
    try {
      const res = await axios.post(`${API}/api/shared-tasks/${task._id}/members`, { userId: selectedUser._id });
      onUpdate(res.data);
    } catch (err) { alert(err.response?.data?.message || 'Failed to add member.'); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const res = await axios.delete(`${API}/api/shared-tasks/${task._id}/members/${memberId}`);
      onUpdate(res.data);
    } catch (err) { alert('Failed to remove member.'); }
  };

  const handleAddComment = async (text) => {
    try {
      await axios.post(`${API}/api/shared-tasks/${task._id}/comments`, { text });
      // socket will update the task in parent
    } catch (err) { alert('Failed to post comment.'); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/api/shared-tasks/${task._id}/comments/${commentId}`);
    } catch (err) { alert('Failed to delete comment.'); }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/shared/${task._id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied! Anyone who opens it (and is logged in) will be added as a member.');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/shared-tasks/${task._id}`);
      onDelete(task._id);
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete.'); }
  };

  const priorityColor = { high: '#dc3545', medium: '#fd7e14', low: '#28a745' };
  const cardStyle = {
    background: task.completed ? '#f9f9f9' : '#fff',
    border: '1px solid #e0e0e0',
    borderLeft: `4px solid ${priorityColor[task.priority] || '#ccc'}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '14px',
    opacity: task.completed ? 0.75 : 1,
  };

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '16px', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</h3>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
            Created by <strong>{task.owner.name}</strong>
            {task.due && <> · Due {task.due}</>}
            {task.category && <> · {task.category}</>}
            <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '10px', background: priorityColor[task.priority], color: '#fff', fontSize: '11px' }}>{task.priority}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button onClick={handleToggleComplete} style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #28a745', color: '#28a745', background: 'none', cursor: 'pointer' }}>
            {task.completed ? 'Reopen' : 'Complete'}
          </button>
          <button onClick={() => setEditing(!editing)} style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #667eea', color: '#667eea', background: 'none', cursor: 'pointer' }}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={handleCopyLink} title="Copy invite link" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #aaa', color: '#555', background: 'none', cursor: 'pointer' }}>🔗</button>
          {isOwner && (
            <button onClick={handleDelete} style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #dc3545', color: '#dc3545', background: 'none', cursor: 'pointer' }}>Delete</button>
          )}
        </div>
      </div>

      {/* Description */}
      {!editing && task.description && <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#444' }}>{task.description}</p>}

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {error && <p style={{ color: 'red', fontSize: '13px', margin: 0 }}>{error}</p>}
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }} required />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={3} style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="date" name="due" value={form.due} onChange={handleChange} style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }} />
            <select name="priority" value={form.priority} onChange={handleChange} style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select name="category" value={form.category} onChange={handleChange} style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}>
              <option value="">No category</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="learn">Learning</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={saving} style={{ padding: '7px 18px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => { setEditing(false); setError(''); }} style={{ padding: '7px 18px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Members panel */}
      <div style={{ marginTop: '12px' }}>
        <button onClick={() => setShowMembers(!showMembers)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px', color: '#667eea' }}>
          👥 Members ({task.members.length + 1}) {showMembers ? '▲' : '▼'}
        </button>
        {showMembers && (
          <div style={{ marginTop: '8px', padding: '10px', background: '#f7f7fb', borderRadius: '8px' }}>
            {/* Owner */}
            <div style={{ fontSize: '13px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>👑</span><strong>{task.owner.name}</strong><span style={{ color: '#aaa', fontSize: '11px' }}>{task.owner.email} · owner</span>
            </div>
            {/* Members */}
            {task.members.map((m) => (
              <div key={m._id || m.userId} style={{ fontSize: '13px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👤</span><span>{m.name}</span><span style={{ color: '#aaa', fontSize: '11px' }}>{m.email}</span>
                {(isOwner || m.userId?.toString() === user?.userId?.toString()) && (
                  <button onClick={() => handleRemoveMember(m.userId)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '12px' }}>
                    {m.userId?.toString() === user?.userId?.toString() ? 'Leave' : 'Remove'}
                  </button>
                )}
              </div>
            ))}
            {/* Add member search */}
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 6px' }}>Add member:</p>
              <MemberSearch onAdd={handleAddMember} excludeIds={allMemberIds} />
            </div>
          </div>
        )}
      </div>

      {/* Comments */}
      <div style={{ marginTop: '8px' }}>
        <button onClick={() => setShowComments(!showComments)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px', color: '#667eea' }}>
          💬 Comments ({task.comments.length}) {showComments ? '▲' : '▼'}
        </button>
        {showComments && (
          <CommentThread
            taskId={task._id}
            comments={task.comments}
            onAdd={handleAddComment}
            onDelete={handleDeleteComment}
          />
        )}
      </div>
    </div>
  );
}
