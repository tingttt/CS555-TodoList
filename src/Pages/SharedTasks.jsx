import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SharedTaskCard from '../components/SharedTaskCard';
import MemberSearch from '../components/MemberSearch';

export default function SharedTasks() {
  const { user, API } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', description: '', due: '', priority: 'low', category: '' });
  const [pendingMembers, setPendingMembers] = useState([]); // users to add on create
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/api/shared-tasks`)
      .then((res) => setTasks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [API]);

  // ── Socket.io real-time ────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(API, { withCredentials: true });

    socket.on('shared-task:created', (task) => {
      setTasks((prev) => prev.find((t) => t._id === task._id) ? prev : [task, ...prev]);
    });
    socket.on('shared-task:updated', (updated) => {
      setTasks((prev) => prev.map((t) => t._id === updated._id ? updated : t));
    });
    socket.on('shared-task:deleted', ({ _id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== _id));
    });
    socket.on('shared-task:comment', ({ taskId, comment }) => {
      setTasks((prev) => prev.map((t) => {
        if (t._id !== taskId) return t;
        const alreadyHas = t.comments.find((c) => c._id === comment._id);
        return alreadyHas ? t : { ...t, comments: [...t.comments, comment] };
      }));
    });
    socket.on('shared-task:comment-deleted', ({ taskId, commentId }) => {
      setTasks((prev) => prev.map((t) =>
        t._id !== taskId ? t : { ...t, comments: t.comments.filter((c) => c._id !== commentId) }
      ));
    });
    socket.on('shared-task:member-joined', ({ taskId }) => {
      // Re-fetch the task to get updated members list
      axios.get(`${API}/api/shared-tasks/${taskId}`).then((res) => {
        setTasks((prev) => prev.map((t) => t._id === taskId ? res.data : t));
      }).catch(() => {});
    });
    socket.on('shared-task:removed', ({ _id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== _id));
    });

    return () => socket.disconnect();
  }, [API]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUpdate = (updated) => {
    setTasks((prev) => prev.map((t) => t._id === updated._id ? updated : t));
  };

  const handleDelete = (id) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const handleAddPendingMember = (u) => {
    if (!pendingMembers.find((m) => m._id === u._id)) {
      setPendingMembers((prev) => [...prev, u]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newForm.title.trim()) { setCreateError('Title is required.'); return; }
    setCreating(true);
    try {
      const payload = {
        ...newForm,
        due: newForm.due ? (() => { const [y, m, d] = newForm.due.split('-'); return `${m}/${d}/${y}`; })() : '',
        memberIds: pendingMembers.map((m) => m._id),
      };
      const res = await axios.post(`${API}/api/shared-tasks`, payload);
      setTasks((prev) => [res.data, ...prev]);
      setNewForm({ title: '', description: '', due: '', priority: 'low', category: '' });
      setPendingMembers([]);
      setShowCreate(false);
      setCreateError('');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create.');
    } finally { setCreating(false); }
  };

  const inputStyle = { width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' };

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (loading) return <div style={{ padding: '32px', textAlign: 'center' }}>Loading shared tasks…</div>;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Shared Tasks</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{ padding: '8px 18px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
        >
          {showCreate ? 'Cancel' : '+ New Shared Task'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: '#f7f7fb', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Create Shared Task</h3>
          {createError && <p style={{ color: 'red', fontSize: '13px' }}>{createError}</p>}
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input name="title" value={newForm.title} onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title *" style={inputStyle} required />
            <textarea name="description" value={newForm.description} onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="date" value={newForm.due} onChange={(e) => setNewForm((f) => ({ ...f, due: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
              <select value={newForm.priority} onChange={(e) => setNewForm((f) => ({ ...f, priority: e.target.value }))} style={{ ...inputStyle, flex: 1 }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select value={newForm.category} onChange={(e) => setNewForm((f) => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, flex: 1 }}>
                <option value="">No category</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="finance">Finance</option>
                <option value="learn">Learning</option>
              </select>
            </div>

            {/* Add members before creating */}
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#555', fontWeight: '600' }}>Add members (optional):</p>
              <MemberSearch
                onAdd={handleAddPendingMember}
                excludeIds={[user?.userId, ...pendingMembers.map((m) => m._id)]}
              />
              {pendingMembers.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {pendingMembers.map((m) => (
                    <span key={m._id} style={{ background: '#e8e8ff', padding: '3px 10px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {m.name}
                      <button onClick={() => setPendingMembers((prev) => prev.filter((p) => p._id !== m._id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '14px', padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={creating} style={{ alignSelf: 'flex-start', padding: '8px 20px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              {creating ? 'Creating…' : 'Create Task'}
            </button>
          </form>
        </div>
      )}

      {/* Active tasks */}
      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '40px' }}>No shared tasks yet. Create one or open a shared link.</p>
      )}

      {activeTasks.map((task) => (
        <SharedTaskCard key={task._id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
      ))}

      {/* Completed shared tasks */}
      {completedTasks.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '16px', color: '#888', marginBottom: '12px' }}>Completed ({completedTasks.length})</h2>
          {completedTasks.map((task) => (
            <SharedTaskCard key={task._id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
