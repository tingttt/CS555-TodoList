import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import validation from '../utils/validation';
import CommentThread from './CommentThread';

const fmt = (fn, val) => { try { return fn(val); } catch { return val; } };

const CompletedTodos = ({ todos, toggleCompleted, onCommentAdded, onCommentDeleted, currentUserId, editTask }) => {
  const { API } = useAuth();
  const completedTodos = todos.filter((t) => t.completed);
  const [openComments, setOpenComments] = useState({});
  if (completedTodos.length === 0) return null;

  return (
    <div className="completedTodos">
      <h2>Completed ({completedTodos.length})</h2>
      {completedTodos.map((todo) => {
        const isSharedWithMe = !!todo._sharedWithMe;
        const myId = currentUserId?.toString();
        const isTaskOwnerOrAssignee = !isSharedWithMe && (
          todo.userId?.toString() === myId ||
          (todo.assignedTo?.userId && todo.assignedTo.userId.toString() === myId)
        );
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
              {isTaskOwnerOrAssignee && editTask && (
                <button className="editbutton" onClick={() => editTask(todo)}>Edit</button>
              )}
              <button
                className="commentbutton"
                onClick={() => setOpenComments((p) => ({ ...p, [todo._id]: !p[todo._id] }))}
              >
                💬 {(todo.comments || []).length} {openComments[todo._id] ? '▲' : '▼'}
              </button>
            </div>

            {openComments[todo._id] && (
              <CommentThread
                taskId={todo._id}
                comments={todo.comments || []}
                taskOwnerId={isSharedWithMe ? todo.userId : currentUserId}
                ownerCanDelete={isTaskOwnerOrAssignee}
                onAdd={(text) => onCommentAdded && onCommentAdded(todo._id, text)}
                onDelete={(commentId) => onCommentDeleted && onCommentDeleted(todo._id, commentId)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CompletedTodos;
