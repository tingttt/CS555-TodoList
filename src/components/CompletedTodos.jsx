import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import validation from '../utils/validation';

function NoteField({ todo, onSaved }) {
  const { API } = useAuth();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(todo.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/api/tasks/${todo._id}`, { notes: note });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved({ ...todo, notes: note });
    } catch { alert('Failed to save note.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ marginTop: '12px' }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{ padding: '5px 14px', background: 'none', border: '1.5px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
        >
          {todo.notes ? '📝 Edit Note' : '+ Add Note'}
        </button>
      ) : (
        <div>
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Write a note…" autoFocus
            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box', display: 'block', fontFamily: 'inherit', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={handleSave} disabled={saving} className="btn-submit" style={{ padding: '6px 16px', fontSize: '0.82rem', marginTop: 0 }}>
              {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setOpen(false); setNote(todo.notes || ''); }}
              style={{ padding: '6px 14px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {!open && todo.notes && (
        <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>📝 {todo.notes}</p>
      )}
    </div>
  );
}

const fmt = (fn, val) => { try { return fn(val); } catch { return val; } };

const CompletedTodos = ({ todos, toggleCompleted, onTaskUpdated }) => {
  const completedTodos = todos.filter((t) => t.completed);
  if (completedTodos.length === 0) return null;

  return (
    <div className="completedTodos">
      <h2>Completed ({completedTodos.length})</h2>
      {completedTodos.map((todo) => {
        const isSharedWithMe = !!todo._sharedWithMe;
        return (
          <div
            key={todo._id}
            className={`todo todo--completed${isSharedWithMe ? ' shared-with-me' : ''}`}
          >
            {isSharedWithMe && (
              <span className="badge badge-shared" style={{ position: 'absolute', top: '12px', right: '12px' }}>Shared</span>
            )}
            <h1 style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
              {fmt(validation.checkTitle, todo.title)}
            </h1>
            {isSharedWithMe && todo.ownerName && (
              <p style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: 600, margin: '0 0 6px' }}>
                Shared by {todo.ownerName}
              </p>
            )}
            {!isSharedWithMe && todo.creatorName && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 6px' }}>
                Created by <strong>{todo.creatorName}</strong>
              </p>
            )}
            <p>{fmt(validation.checkDescription, todo.description)}</p>
            <div className="todo-meta">
              {todo.due && <span className="due-date-badge">📅 {fmt((d) => validation.checkDate(d, 'Due Date'), todo.due)}</span>}
              {todo.priority && <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>}
              {todo.category && <span className="badge badge-category">{todo.category}</span>}
              {todo.assignedTo?.name && <span className="badge badge-assigned">👤 {todo.assignedTo.name}</span>}
              <span className="badge badge-done">✓ Done</span>
            </div>
            <div className="todo-actions">
              <button onClick={() => toggleCompleted(todo)}>Mark Incomplete</button>
              {!isSharedWithMe && onTaskUpdated && <NoteField todo={todo} onSaved={onTaskUpdated} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CompletedTodos;
