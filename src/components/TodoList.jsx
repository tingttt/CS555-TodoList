import React, { useRef, useState } from "react";
import axios from "axios";
import validation from "../utils/validation";
import { useAuth } from "../context/AuthContext";
import CommentThread from "./CommentThread";

const PRIORITY_COLOR = { high: "#dc3545", medium: "#fd7e14", low: "#28a745" };

const TodoList = ({
  todos, deleteTodo, toggleCompleted, editTask,
  sortBy, setSortBy, searchQuery, setSearchQuery,
  filterPriority, setFilterPriority, filterCategory, setFilterCategory,
  selectedIds, setSelectedIds, bulkComplete, bulkDelete, reorderTodos,
}) => {
  const { user, API } = useAuth();
  const dragId = useRef(null);
  const [openComments, setOpenComments] = useState({});

  // Only own (non-shared-with-me) tasks are selectable / bulk-actionable
  const ownIncomplete = todos.filter((t) => !t.completed && !t._sharedWithMe);
  const allSelected =
    ownIncomplete.length > 0 && ownIncomplete.every((t) => selectedIds.includes(t._id));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(ownIncomplete.map((t) => t._id));
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isPastDue = (due) => {
    try {
      if (!due) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const validated = validation.checkDate(due, "Due Date");
      const [m, d, y] = validated.split("/").map(Number);
      const dueDate = new Date(y, m - 1, d);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    } catch {
      return false;
    }
  };

  const formatDate  = (d) => { try { return validation.checkDate(d, "Due Date"); } catch { return d; } };
  const formatTitle = (t) => { try { return validation.checkTitle(t); } catch { return t; } };
  const formatDesc  = (d) => { try { return validation.checkDescription(d); } catch { return d; } };

  const handleAddComment = async (taskId, text) => {
    try {
      // Fire-and-forget — the server emits task:comment via socket to ALL members
      // including the sender, so state update happens in the socket handler.
      // We do NOT call onCommentAdded here to avoid duplicate insertion.
      await axios.post(`${API}/api/tasks/${taskId}/comments`, { text });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post comment.");
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    try {
      // Socket event task:comment-deleted handles state removal for all members including self
      await axios.delete(`${API}/api/tasks/${taskId}/comments/${commentId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  const activeTodos = todos.filter((t) => !t.completed);

  return (
    <div className="todoList">
      <h2>Todo List</h2>

      {/* Bulk select bar — own tasks only */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
          Select All
        </label>
        {selectedIds.length > 0 && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#555" }}>{selectedIds.length} selected</span>
            <button
              onClick={bulkComplete}
              style={{ padding: "4px 12px", background: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
            >
              Complete Selected
            </button>
            <button
              onClick={bulkDelete}
              style={{ padding: "4px 12px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Sort */}
      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="sort">Sort by: </label>
        <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="smart">Smart (Priority + Due Date)</option>
          <option value="none">None</option>
          <option value="due-asc">Due Date (Earliest First)</option>
          <option value="due-desc">Due Date (Latest First)</option>
          <option value="priority">Priority (High to Low)</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="search">Search: </label>
        <input
          id="search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or description..."
        />
      </div>

      {/* Filters */}
      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="filterPriority">Priority: </label>
        <select id="filterPriority" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="filterCategory">Category: </label>
        <select id="filterCategory" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">All</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="health">Health</option>
          <option value="finance">Finance</option>
          <option value="learn">Learning</option>
        </select>
      </div>

      {/* Task cards */}
      {activeTodos.map((todo) => {
        const overdue       = isPastDue(todo.due);
        const isSharedWithMe = !!todo._sharedWithMe;
        // Own task that has been shared out
        const isSharedOut   = !isSharedWithMe && todo.isShared && todo.sharedWith?.length > 0;
        const showComments  = !!openComments[todo._id];

        const cardBg     = isSharedWithMe ? "#f0fafa" : "#fff";
        const borderLeft = isSharedWithMe
          ? "4px solid #20c997"
          : `4px solid ${PRIORITY_COLOR[todo.priority] || "#ccc"}`;

        return (
          <div
            key={todo._id}
            className={`todo ${overdue && !isSharedWithMe ? "todo--overdue" : ""}`}
            style={{
              position: "relative",
              background: cardBg,
              borderLeft,
              borderRadius: "8px",
              border: `1px solid ${isSharedWithMe ? "#b2e8e0" : "#e0e0e0"}`,
              borderLeftWidth: "4px",
              padding: "12px 14px",
              marginBottom: "10px",
              cursor: isSharedWithMe ? "default" : "grab",
            }}
            draggable={!isSharedWithMe}
            onDragStart={() => { if (!isSharedWithMe) dragId.current = todo._id; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!isSharedWithMe) { reorderTodos(dragId.current, todo._id); dragId.current = null; }
            }}
          >
            {/* Selection checkbox — own tasks only */}
            {!isSharedWithMe && (
              <input
                type="checkbox"
                checked={selectedIds.includes(todo._id)}
                onChange={() => toggleSelectOne(todo._id)}
                style={{ position: "absolute", top: "10px", right: "10px", width: "16px", height: "16px", cursor: "pointer" }}
              />
            )}

            {/* "Shared" badge — task shared with me */}
            {isSharedWithMe && (
              <span style={{
                position: "absolute", top: "10px", right: "10px",
                background: "#20c997", color: "#fff",
                fontSize: "10px", fontWeight: "700", letterSpacing: "0.5px",
                padding: "2px 7px", borderRadius: "10px", textTransform: "uppercase",
              }}>
                Shared
              </span>
            )}

            {/* "Shared ↗" badge — own task shared out */}
            {isSharedOut && (
              <span style={{
                position: "absolute", top: "10px", right: "30px",
                background: "#667eea", color: "#fff",
                fontSize: "10px", fontWeight: "700", letterSpacing: "0.5px",
                padding: "2px 7px", borderRadius: "10px", textTransform: "uppercase",
                marginRight: "22px",
              }}>
                Shared ↗
              </span>
            )}

            <h1 style={{ margin: "0 0 4px", fontSize: "16px" }}>{formatTitle(todo.title)}</h1>

            {/* Creator line — shown on every card */}
            {isSharedWithMe ? (
              <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#20c997", fontWeight: "600" }}>
                Shared by {todo.ownerName || todo.creatorName || "someone"}
              </p>
            ) : (
              <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#888" }}>
                Created by <strong>{todo.creatorName || user?.name || "You"}</strong>
                {todo.creatorEmail ? ` (${todo.creatorEmail})` : ""}
              </p>
            )}

            <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#555" }}>{formatDesc(todo.description)}</p>

            {todo.due && (
              <p style={{ margin: "0 0 4px" }}>
                <span className={`due-date-badge ${overdue ? "due-date-badge--overdue" : ""}`}>
                  {overdue ? "⚠ Overdue: " : "Due: "}{formatDate(todo.due)}
                </span>
              </p>
            )}
            {todo.priority && <p style={{ margin: "0 0 2px", fontSize: "13px" }}>Priority: {todo.priority}</p>}
            {todo.category && <p style={{ margin: "0 0 2px", fontSize: "13px" }}>Category: {todo.category}</p>}
            {todo.assignedTo?.name && (
              <p style={{ margin: "0 0 2px", fontSize: "13px" }}>
                Assigned To: <strong>{todo.assignedTo.name}</strong>{" "}
                <span style={{ fontSize: "12px", color: "#888" }}>({todo.assignedTo.email})</span>
              </p>
            )}

            <p style={{ margin: "6px 0 8px", fontSize: "13px" }}>Completed: No</p>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {/* Delete — own tasks only */}
              {!isSharedWithMe && (
                <button
                  className="deletebutton"
                  onClick={() => { if (window.confirm(`Delete "${todo.title}"?`)) deleteTodo(todo._id); }}
                >
                  Delete
                </button>
              )}

              <button onClick={() => toggleCompleted(todo)}>Complete</button>

              {/* Edit — owner can always edit; shared-with-me users cannot edit fields */}
              {!isSharedWithMe && (
                <button
                  onClick={() => editTask(todo)}
                  style={{ padding: "4px 12px", background: "#667eea", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                >
                  Edit
                </button>
              )}

              {/* Comments toggle — available on ALL tasks */}
              <button
                onClick={() => setOpenComments((prev) => ({ ...prev, [todo._id]: !prev[todo._id] }))}
                style={{ padding: "4px 12px", background: "none", border: "1px solid #667eea", color: "#667eea", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
              >
                💬 Comments ({(todo.comments || []).length}) {showComments ? "▲" : "▼"}
              </button>
            </div>

            {/* Comment thread — visible on ALL tasks */}
            {showComments && (
              <CommentThread
                taskId={todo._id}
                comments={todo.comments || []}
                taskOwnerId={isSharedWithMe ? todo.userId : user?.userId}
                onAdd={(text) => handleAddComment(todo._id, text)}
                onDelete={(commentId) => handleDeleteComment(todo._id, commentId)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TodoList;
