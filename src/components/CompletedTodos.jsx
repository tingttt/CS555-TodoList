// src/components/CompletedTodos.jsx
import React from "react";
import validation from "../utils/validation";
const CompletedTodos = ({ todos, toggleCompleted }) => {
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
    <div className="completedTodos">
      <h2>Completed Todos</h2>
      {todos
        .filter((todo) => todo.completed)
        .map(
          (
            todo //filter only completed todos, map through each todo to display
          ) => (
            <div key={todo.id} className="todo">
              <h1>{formatAndValidateTitle(todo.title)}</h1>
              <p>{formatAndValidateDescription(todo.description)}</p>
              <p>Due Date: {formatAndValidateDate(todo.due)}</p>
              <p>Completed: Yes</p>
              <button onClick={() => toggleCompleted(todo)}>
                Mark Incomplete
              </button>
            </div>
          )
        )}
    </div>
  );
};

export default CompletedTodos;
