import React from "react";
import validation from "../utils/validation";
const TodoList = ({ todos, deleteTodo, toggleCompleted, editTask }) => {

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
    return duedate < today ? "text-danger" : "text-dark";
  } catch (e) {
    return "text-dark"; // Default if date is empty/invalid
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
      {todos
        .filter((todo) => !todo.completed) //filter only not completed todos
        .map(
          (
            todo //iterate through each todo to display
          ) => (
            <div key={todo.id} className="todo">
              <h1 className={isPastDue(todo.due)}>
                {formatAndValidateTitle(todo.title)}
              </h1>
              <p>{formatAndValidateDescription(todo.description)}</p>
              <p className={isPastDue(todo.due)}>
                Due Date: {formatAndValidateDate(todo.due)}
              </p>
              <p>Priority: {todo.priority}</p>
              <p>Category: {todo.category}</p>
              <p>Completed: No</p>
              <button
                className="deletebutton"
                onClick={() => deleteTodo(todo.id)}>Delete</button>
              <button onClick={() => toggleCompleted(todo)}>Complete</button>
              <button onClick={() => editTask(todo)}>Edit</button>
            </div>
          )
        )}
    </div>
  );
};

export default TodoList;
