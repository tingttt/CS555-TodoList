import React from "react";
import validation from "../utils/validation";

const CompletedTodos = ({ todos, toggleCompleted }) => {
  const fmt = (fn, val) => { try { return fn(val); } catch { return val; } };

  return (
    <div className="completedTodos">
      <h2>Completed ({todos.filter((t) => t.completed).length})</h2>
      {todos.filter((t) => t.completed).map((todo) => (
        <div key={todo.id} className="todo" style={{ opacity: 0.75 }}>
          <h1 style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>
            {fmt(validation.checkTitle, todo.title)}
          </h1>
          <p>{fmt(validation.checkDescription, todo.description)}</p>
          <div className="todo-meta">
            <span className="due-date-badge">📅 {fmt(validation.checkDate, todo.due)}</span>
            {todo.priority && <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>}
            {todo.category && <span className="badge badge-category">{todo.category}</span>}
            <span className="badge badge-done">✓ Done</span>
          </div>
          <div className="todo-actions">
            <button onClick={() => toggleCompleted(todo)}>Mark Incomplete</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompletedTodos;
