import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * CommentThread — used on all tasks (personal and shared).
 *
 * Props:
 *   taskId        — the task's _id
 *   comments      — array of comment objects
 *   taskOwnerId   — userId of the task's owner
 *   onAdd(text)   — async callback to post a comment
 *   onDelete(id)  — async callback to delete a comment
 *   // ownerCanDelete: if true, task owner can delete any comment (SharedTask behaviour)
 *   //                 if false/omitted, only comment author can delete (personal task spec)
 *   ownerCanDelete — boolean, default false
 */
export default function CommentThread({ taskId, comments = [], taskOwnerId, onAdd, onDelete, ownerCanDelete = false }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myId = user?.userId?.toString();
  const ownerId = taskOwnerId?.toString();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await onAdd(text.trim());
    setText('');
    setSubmitting(false);
  };

  const canDelete = (comment) => {
    const commentAuthor = comment.userId?.toString();
    if (myId === commentAuthor) return true;           // always own comment
    if (ownerCanDelete && myId === ownerId) return true; // owner override flag
    return false;
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
      <strong style={{ fontSize: '13px', color: '#555' }}>Comments ({comments.length})</strong>

      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
        {comments.length === 0 && <p style={{ fontSize: '13px', color: '#aaa' }}>No comments yet.</p>}
        {comments.map((c) => (
          <div key={c._id} style={{ background: '#f7f7fb', borderRadius: '8px', padding: '8px 12px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', fontSize: '13px' }}>
                {c.name}
                {c.userId?.toString() === ownerId && (
                  <span style={{ marginLeft: '6px', fontSize: '10px', background: '#667eea', color: '#fff', padding: '1px 5px', borderRadius: '8px' }}>
                    owner
                  </span>
                )}
              </span>
              <span style={{ fontSize: '11px', color: '#aaa' }}>{formatTime(c.createdAt)}</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{c.text}</p>
            {canDelete(c) && (
              <button
                onClick={() => onDelete(c._id)}
                style={{ position: 'absolute', top: '6px', right: '8px', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
                title="Delete comment"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          style={{ padding: '7px 16px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', opacity: submitting ? 0.6 : 1 }}
        >
          Post
        </button>
      </form>
    </div>
  );
}
