import React, { useRef } from "react";
import validation from "../utils/validation";
const TodoList = ({ todos, deleteTodo, toggleCompleted, editTask, sortBy, setSortBy, searchQuery, setSearchQuery, filterPriority, setFilterPriority, filterCategory, setFilterCategory, selectedIds, setSelectedIds, bulkComplete, bulkDelete, reorderTodos }) => {
  const dragId = useRef(null);
  const visibleIncomplete = todos.filter((t) => !t.completed);
  const allSelected = visibleIncomplete.length > 0 && visibleIncomplete.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleIncomplete.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };


const isPastDue = (due) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get the validated string
    const validatedDateStr = validation.checkDate(due, "Due Date");
    
    // 2. Parse manually to avoid UTC shifts
    const [m, d, y] = validatedDateStr.split('/').map(Number);
    const duedate = new Date(y, m - 1, d); 
    duedate.setHours(0, 0, 0, 0);

    // 3. Return Bootstrap-friendly names or hex codes
    return duedate < today;
  } catch (e) {
    return false; // Default if date is empty/invalid
  }
};

  const formatAndValidateDate = (date) => {
    try {
      return validation.checkDate(date, "Due Date");
    } catch (error) {
      console.error(error.message);
      return date;
    }
  };
  const formatAndValidateTitle = (title) => {
    try {
      return validation.checkTitle(title);
    } catch (error) {
      console.error(error.message);
      return title;
    }
  };
  const formatAndValidateDescription = (description) => {
    try {
      return validation.checkDescription(description);
    } catch (error) {
      console.error(error.message);
      return description;
    }
  };

  return (
    <div className="todoList">
      <div className="todolist-header">
        <h2>Todo List</h2>
        <label className="select-all-label">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
          <span>Select All</span>
        </label>
      </div>

      {selectedIds.length > 0 && (
        <div className="bulk-action-bar">
          <span className="bulk-count">{selectedIds.length} selected</span>
          <button className="bulk-btn bulk-btn--complete" onClick={bulkComplete}>✓ Complete</button>
          <button className="bulk-btn bulk-btn--delete" onClick={bulkDelete}>✕ Delete</button>
        </div>
      )}

      <div className="todolist-filters">
        <div className="filter-search">
          <span className="filter-icon">🔍</span>
          <input
            type="text"
            value={searchQuery}
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
      {todos
        .filter((todo) => !todo.completed) //filter only not completed todos
        .map((todo) => {
          const overdue = isPastDue(todo.due);
          return (
            <div
              key={todo.id}
              className={`todo ${overdue ? "todo--overdue" : ""} ${todo.priority ? `priority-${todo.priority}` : ""}`}
              style={{ position: "relative" }}
              draggable
              onDragStart={() => { dragId.current = todo.id; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { reorderTodos(dragId.current, todo.id); dragId.current = null; }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(todo.id)}
                onChange={() => toggleSelectOne(todo.id)}
                style={{ position: "absolute", top: "12px", right: "12px", width: "16px", height: "16px", cursor: "pointer" }}
              />
              <h1>{formatAndValidateTitle(todo.title)}</h1>
              <p style={{ marginBottom: "10px" }}>{formatAndValidateDescription(todo.description)}</p>
              <div className="todo-meta">
                <span className={`due-date-badge ${overdue ? "due-date-badge--overdue" : ""}`}>
                  {overdue ? "⚠ Overdue: " : "📅 "}{formatAndValidateDate(todo.due)}
                </span>
                {todo.priority && <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>}
                {todo.category && <span className="badge badge-category">{todo.category}</span>}
                {todo.assignedTo && <span className="badge badge-assigned">👤 {todo.assignedTo}</span>}
              </div>
              <div className="todo-actions">
                <button className="deletebutton" onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${todo.title}"?`)) {
                    deleteTodo(todo.id);
                  }
                }}>Delete</button>
                <button onClick={() => toggleCompleted(todo)}>Complete</button>
                <button className="editbutton" onClick={() => editTask(todo)}>Edit</button>
              </div>
            </div>
          );
        })
        }
    </div>
    
  );
};

export default TodoList;
