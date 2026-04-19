import React, { useRef } from "react";
import validation from "../utils/validation";

const TodoList = ({
  todos, deleteTodo, toggleCompleted, editTask,
  sortBy, setSortBy, searchQuery, setSearchQuery,
  filterPriority, setFilterPriority, filterCategory, setFilterCategory,
  selectedIds, setSelectedIds, bulkComplete, bulkDelete, reorderTodos,
}) => {
  const dragId = useRef(null);
  const visibleIncomplete = todos.filter((t) => !t.completed);
  const allSelected = visibleIncomplete.length > 0 && visibleIncomplete.every((t) => selectedIds.includes(t._id));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(visibleIncomplete.map((t) => t._id));
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

  const formatDate = (date) => { try { return validation.checkDate(date, "Due Date"); } catch { return date; } };
  const formatTitle = (t) => { try { return validation.checkTitle(t); } catch { return t; } };
  const formatDesc = (d) => { try { return validation.checkDescription(d); } catch { return d; } };

  return (
    <div className="todoList">
      <h2>Todo List</h2>

      {/* Bulk select bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
          Select All
        </label>
        {selectedIds.length > 0 && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#555" }}>{selectedIds.length} selected</span>
            <button onClick={bulkComplete} style={{ padding: "4px 12px", background: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}>Complete Selected</button>
            <button onClick={bulkDelete} style={{ padding: "4px 12px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}>Delete Selected</button>
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
        <input id="search" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title or description..." />
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
      {todos.filter((t) => !t.completed).map((todo) => {
        const overdue = isPastDue(todo.due);
        return (
          <div
            key={todo._id}
            className={`todo ${overdue ? "todo--overdue" : ""}`}
            style={{ position: "relative", cursor: "grab" }}
            draggable
            onDragStart={() => { dragId.current = todo._id; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { reorderTodos(dragId.current, todo._id); dragId.current = null; }}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(todo._id)}
              onChange={() => toggleSelectOne(todo._id)}
              style={{ position: "absolute", top: "10px", right: "10px", width: "16px", height: "16px", cursor: "pointer" }}
            />
            <h1>{formatTitle(todo.title)}</h1>
            <p>{formatDesc(todo.description)}</p>
            {todo.due && (
              <p>
                <span className={`due-date-badge ${overdue ? "due-date-badge--overdue" : ""}`}>
                  {overdue ? "⚠ Overdue: " : "Due: "}{formatDate(todo.due)}
                </span>
              </p>
            )}
            {todo.priority && <p>Priority: {todo.priority}</p>}
            {todo.category && <p>Category: {todo.category}</p>}
            {todo.assignedTo?.name && (
              <p>
                Assigned To: <strong>{todo.assignedTo.name}</strong>{" "}
                <span style={{ fontSize: "12px", color: "#888" }}>({todo.assignedTo.email})</span>
              </p>
            )}
            {todo.isShared && (
              <p style={{ fontSize: "12px", color: "#667eea" }}>
                🔗 Shared with {todo.sharedWith?.length || 0} person{(todo.sharedWith?.length || 0) !== 1 ? "s" : ""}
              </p>
            )}
            <p>Completed: No</p>
            <button
              className="deletebutton"
              onClick={() => { if (window.confirm(`Are you sure you want to delete "${todo.title}"?`)) deleteTodo(todo._id); }}
            >
              Delete
            </button>
            <button onClick={() => toggleCompleted(todo)}>Complete</button>
            <button
              onClick={() => editTask(todo)}
              style={{ marginLeft: "6px", padding: "4px 12px", background: "#667eea", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Edit
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default TodoList;
