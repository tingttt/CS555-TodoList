import React from "react";
import validation from "../utils/validation";
const TodoList = ({ todos, deleteTodo, toggleCompleted, editTask, sortBy, setSortBy, searchQuery, setSearchQuery }) => {


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
      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="sort">Sort by: </label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
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
      {todos
        .filter((todo) => !todo.completed) //filter only not completed todos
        .map((todo) => {
          const overdue = isPastDue(todo.due);
          return (
            <div key={todo.id} className={`todo ${overdue ? "todo--overdue" : ""}`}>
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
              <button className="deletebutton" onClick={() => deleteTodo(todo.id)}>Delete</button>
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
