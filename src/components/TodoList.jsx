import React, { useRef, useState } from "react";
import axios from "axios";
import validation from "../utils/validation";
import { useAuth } from "../context/AuthContext";
import CommentThread from "./CommentThread";

const PRIORITY_CLASS = { high: "priority-high", medium: "priority-medium", low: "priority-low" };

const TodoList = ({
  todos, deleteTodo, toggleCompleted, editTask,
  sortBy, setSortBy, searchQuery, setSearchQuery,
  filterPriority, setFilterPriority, filterCategory, setFilterCategory,
  selectedIds, setSelectedIds, bulkComplete, bulkDelete, reorderTodos,
}) => {
  const { user, API } = useAuth();
  const dragId = useRef(null);
  const [openComments, setOpenComments] = useState({});

  // Only own (non-shared-with-me) incomplete tasks are selectable
  const ownIncomplete = todos.filter((t) => !t.completed && !t._sharedWithMe);
  const allSelected = ownIncomplete.length > 0 && ownIncomplete.every((t) => selectedIds.includes(t._id));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(ownIncomplete.map((t) => t._id));
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const isPastDue = (due) => {
    try {
      if (!due) return false;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const validated = validation.checkDate(due, "Due Date");
      const [m, d, y] = validated.split("/").map(Number);
      const dueDate = new Date(y, m - 1, d); dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    } catch { return false; }
  };

  const formatDate  = (d) => { try { return validation.checkDate(d, "Due Date"); } catch { return d; } };
  const formatTitle = (t) => { try { return validation.checkTitle(t); } catch { return t; } };
  const formatDesc  = (d) => { try { return validation.checkDescription(d); } catch { return d; } };

  const handleAddComment = async (taskId, text) => {
    try {
      await axios.post(`${API}/api/tasks/${taskId}/comments`, { text });
      // socket task:comment handles state update for all users including sender
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post comment.");
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    try {
      await axios.delete(`${API}/api/tasks/${taskId}/comments/${commentId}`);
      // socket task:comment-deleted handles state removal
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  const activeTodos = todos.filter((t) => !t.completed);

  return (
    <div className="todoList">
      {/* Header row — title + select all */}
      <div className="todolist-header">
        <h2>Todo List</h2>
        <label className="select-all-label">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
          <span>Select All</span>
        </label>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar">
          <span className="bulk-count">{selectedIds.length} selected</span>
          <button className="bulk-btn bulk-btn--complete" onClick={bulkComplete}>✓ Complete</button>
          <button className="bulk-btn bulk-btn--delete" onClick={bulkDelete}>✕ Delete</button>
        </div>
      )}

      {/* Filters */}
      <div className="todolist-filters">
        <div className="filter-search">
          <span className="filter-icon">🔍</span>
          <input
            type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
          />
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <label>Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="smart">Smart</option>
              <option value="none">None</option>
              <option value="due-asc">Due ↑</option>
              <option value="due-desc">Due ↓</option>
              <option value="priority">Priority</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Priority</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="learn">Learning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task cards */}
      {activeTodos.map((todo) => {
        const overdue        = isPastDue(todo.due);
        const isSharedWithMe = !!todo._sharedWithMe;
        const isSharedOut    = !isSharedWithMe && todo.isShared && todo.sharedWith?.length > 0;
        const showComments   = !!openComments[todo._id];
        // Can edit if you are the creator OR the assigned user
        const myId = user?.userId?.toString();
        const isTaskOwnerOrAssignee = !isSharedWithMe && (
          todo.userId?.toString() === myId ||
          (todo.assignedTo?.userId && todo.assignedTo.userId.toString() === myId)
        );

        const cardClasses = [
          "todo",
          PRIORITY_CLASS[todo.priority] || "",
          overdue && !isSharedWithMe ? "todo--overdue" : "",
          isSharedWithMe ? "shared-with-me" : "",
        ].filter(Boolean).join(" ");

        return (
          <div
            key={todo._id}
            className={cardClasses}
            style={{ position: "relative", cursor: isSharedWithMe ? "default" : "grab" }}
            draggable={!isSharedWithMe}
            onDragStart={() => { if (!isSharedWithMe) dragId.current = todo._id; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (!isSharedWithMe) { reorderTodos(dragId.current, todo._id); dragId.current = null; } }}
          >
            {/* Selection checkbox — own tasks only */}
            {!isSharedWithMe && (
              <input
                type="checkbox"
                checked={selectedIds.includes(todo._id)}
                onChange={() => toggleSelectOne(todo._id)}
                style={{ position: "absolute", top: "14px", right: "16px", width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--primary)" }}
              />
            )}

            {/* Shared-with-me badge */}
            {isSharedWithMe && (
              <span className="badge badge-shared" style={{ position: "absolute", top: "14px", right: "16px" }}>Shared</span>
            )}

            {/* Own task shared-out badge */}
            {isSharedOut && (
              <span className="badge badge-shared-out" style={{ position: "absolute", top: "14px", right: selectedIds.includes(todo._id) ? "38px" : "16px" }}>
                Shared ↗
              </span>
            )}

            <h1>{formatTitle(todo.title)}</h1>

            {/* Creator line */}
            {isSharedWithMe ? (
              <p style={{ fontSize: "0.8rem", color: "#0f766e", fontWeight: 600, margin: "0 0 6px" }}>
                Shared by {todo.ownerName || todo.creatorName || "someone"}
              </p>
            ) : (
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 6px" }}>
                Created by <strong>{todo.creatorName || user?.name || "You"}</strong>
              </p>
            )}

            <p>{formatDesc(todo.description)}</p>

            <div className="todo-meta">
              {todo.due && (
                <span className={`due-date-badge${overdue && !isSharedWithMe ? " due-date-badge--overdue" : ""}`}>
                  {overdue && !isSharedWithMe ? "⚠ Overdue: " : "📅 "}{formatDate(todo.due)}
                </span>
              )}
              {todo.priority && <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>}
              {todo.category && <span className="badge badge-category">{todo.category}</span>}
              {todo.assignedTo?.name && <span className="badge badge-assigned">👤 {todo.assignedTo.name}</span>}
            </div>

            <div className="todo-actions">
              {/* Delete — creator or assigned user only */}
              {isTaskOwnerOrAssignee && (
                <button
                  className="deletebutton"
                  onClick={() => { if (window.confirm(`Delete "${todo.title}"?`)) deleteTodo(todo._id); }}
                >
                  Delete
                </button>
              )}

              <button onClick={() => toggleCompleted(todo)}>Complete</button>

              {/* Edit — creator or assigned user only */}
              {isTaskOwnerOrAssignee && (
                <button className="editbutton" onClick={() => editTask(todo)}>Edit</button>
              )}

              {/* Comments — all tasks */}
              <button
                className="commentbutton"
                onClick={() => setOpenComments((p) => ({ ...p, [todo._id]: !p[todo._id] }))}
              >
                💬 {(todo.comments || []).length} {showComments ? "▲" : "▼"}
              </button>
            </div>

            {/* Comment thread */}
            {showComments && (
              <CommentThread
                taskId={todo._id}
                comments={todo.comments || []}
                taskOwnerId={isSharedWithMe ? todo.userId : user?.userId}
                ownerCanDelete={isTaskOwnerOrAssignee}
                onAdd={(text) => handleAddComment(todo._id, text)}
                onDelete={(commentId) => handleDeleteComment(todo._id, commentId)}
              />
            )}
          </div>
        );
      })}

      {activeTodos.length === 0 && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "40px", fontSize: "0.95rem" }}>
          No tasks yet. Add one above!
        </p>
      )}
    </div>
  );
};

export default TodoList;
