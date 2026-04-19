import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
    <div style={{ marginTop: '10px' }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{ padding: '4px 14px', background: 'none', border: '1px solid #aaa', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#555' }}
        >
          {todo.notes ? '📝 Edit Note' : '+ Add Note'}
        </button>
      ) : (
        <div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Write a note…"
            autoFocus
            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', display: 'block' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '4px 14px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setOpen(false); setNote(todo.notes || ''); }}
              style={{ padding: '4px 14px', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#555' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Show saved note preview when collapsed */}
      {!open && todo.notes && (
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#555', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>📝 {todo.notes}</p>
      )}
    </div>
  );
}

const CompletedTodos = ({ todos, toggleCompleted, onTaskUpdated }) => {
  const completedTodos = todos.filter((todo) => todo.completed);
  if (completedTodos.length === 0) return null;

  return (
    <div className="completedTodos">
      <h2>Completed Todos</h2>
      {completedTodos.map((todo) => (
        <div key={todo._id} className="todo todo--completed" style={{ opacity: 0.8 }}>
          <h1 style={{ textDecoration: 'line-through' }}>{todo.title}</h1>
          {todo.description && <p>{todo.description}</p>}
          {todo.due && <p>Due: {todo.due}</p>}
          {todo.priority && <p>Priority: {todo.priority}</p>}
          {todo.category && <p>Category: {todo.category}</p>}
          {todo.assignedTo?.name && (
            <p>Assigned To: <strong>{todo.assignedTo.name}</strong> <span style={{ fontSize: '12px', color: '#888' }}>({todo.assignedTo.email})</span></p>
          )}
          <p>Completed: Yes ✅</p>
          <button onClick={() => toggleCompleted(todo)}>Uncomplete</button>
          <NoteField todo={todo} onSaved={onTaskUpdated} />
        </div>
      ))}
    </div>
  );
};

export default CompletedTodos;
