import React from "react";
import validation from "../utils/validation";
const TodoList = ({ todos, deleteTodo, toggleCompleted, editTask, sortBy, setSortBy, searchQuery, setSearchQuery, filterPriority, setFilterPriority, filterCategory, setFilterCategory, selectedIds, setSelectedIds, bulkComplete, bulkDelete }) => {
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
      <h2>Todo List</h2>

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

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="sort">Sort by: </label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="smart">Smart (Priority + Due Date)</option>
          <option value="none">None</option>
          <option value="due-asc">Due Date (Earliest First)</option>
          <option value="due-desc">Due Date (Latest First)</option>
          <option value="priority">Priority (High to Low)</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>
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
      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="filterPriority">Priority: </label>
        <select
          id="filterPriority"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="filterCategory">Category: </label>
        <select
          id="filterCategory"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="health">Health</option>
          <option value="finance">Finance</option>
          <option value="learn">Learning</option>
        </select>
      </div>
      {todos
        .filter((todo) => !todo.completed) //filter only not completed todos
        .map((todo) => {
          const overdue = isPastDue(todo.due);
          return (
            <div key={todo.id} className={`todo ${overdue ? "todo--overdue" : ""}`} style={{ position: "relative" }}>
              <input
                type="checkbox"
                checked={selectedIds.includes(todo.id)}
                onChange={() => toggleSelectOne(todo.id)}
                style={{ position: "absolute", top: "10px", right: "10px", width: "16px", height: "16px", cursor: "pointer" }}
              />
              <h1>{formatAndValidateTitle(todo.title)}</h1>
              <p>{formatAndValidateDescription(todo.description)}</p>
              <p>
                <span className={`due-date-badge ${overdue ? "due-date-badge--overdue" : ""}`}>
                  {overdue ? "⚠ Overdue: " : "Due: "}
                  {formatAndValidateDate(todo.due)}
                </span>
              </p>
              {todo.priority && <p>Priority: {todo.priority}</p>}
              {todo.category && <p>Category: {todo.category}</p>}
              {todo.assignedTo && <p>Assigned To: {todo.assignedTo}</p>}
              <p>Completed: No</p>
              <button className="deletebutton" onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${todo.title}"?`)) {
                  deleteTodo(todo.id);
                }
              }}>Delete</button>
              <button onClick={() => toggleCompleted(todo)}>Complete</button>
              <button onClick={() => editTask(todo)}>Edit</button>
            </div>
          );
        })
        }
    </div>
    
  );
};

export default TodoList;
