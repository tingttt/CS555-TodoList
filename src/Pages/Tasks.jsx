import React, { useState } from "react";
import TodoList from "../components/TodoList";
import CompletedTodos from "../components/CompletedTodos";
import AddTodo from "../components/AddTodo";


const Tasks = () => {
  const hardcodedBuyApple = [
    {
      id: 1,
      title: "Buy 1 Apple",
      description: "On the first day of the month, buy an apple",
      due: "3/15/2023",
      completed: false,
    },
    {
      id: 2,
      title: "Buy 2 Apple",
      description: "On the second day of the month, buy two apples",
      due: "3/15/2023",
      completed: false,
    },
    {
      id: 3,
      title: "Buy 3 Apple",
      description: "On the third day of the month, buy three apples",
      due: "3/15/2023",
      completed: false,
    },
    {
      id: 4,
      title: "Buy 4 Apple",
      description: "On the fourth day of the month, buy four apples",
      due: "3/15/2023",
      completed: false,
    },
    {
      id: 5,
      title: "Buy 5 Apple",
      description: "On the fifth day of the month, buy five apples",
      due: "3/15/2023",
      completed: false,
    },
    {
      id: 6,
      title: "Buy 6 Apple",
      description: "Pay the cable bill by the 15th of the month",
      due: "3/15/2023",
      completed: false,
    },
    {
      id: 7,
      title: "Buy 7 Apple",
      description: "Pay the cable bill by the 15th of the month",
      due: "3/15/2023",
      completed: false,
    },
    {
      id: 8,
      title: "Buy 8 Apple",
      description: "Pay the cable bill by the 15th of the month",
      due: "3/15/2023",
      completed: false,
    },
    {
      id: 9,
      title: "Buy 9 Apple",
      description: "On the ninth day of the month, buy nine apples",
      due: "3/15/2023",
      completed: false,
    },
    {
      id: 10,
      title: "Buy 10 Apple",
      description: "On the tenth day of the month, buy ten apples",
      priority :"low",
      category:"work",
      due: "3/15/2023",
      completed: false,
    },
  ];
  const [todos, setTodos] = useState(hardcodedBuyApple); // first set todos with initial valu hardcoded data

  const [nextId, setNextId] = useState(hardcodedBuyApple.length + 1); // Start from 11 for add toDOs

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    // keep all ids except the one to delete, so that todos without that id remains
  };
  // toggle Complete and add and delete should all on this jsx file, because all these functions change the todos state
  const toggleCompleted = (todoToToggle) => {
    setTodos(
      todos.map((todo) =>
        todo.id === todoToToggle.id //Set the one completed to the oposite using Iternary operator
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };

  const addTodo = (newTodo) => {
    const todoWithId = {
      id: nextId,
      ...newTodo, //add id to the new todo
    };

    setTodos([...todos, todoWithId]); // add new todo to existing todos
    setNextId(nextId + 1); // increment nextId for future todos
  };

  return (
    <div>
      <h1>Task Page</h1>

      <AddTodo addTodo={addTodo} />
      <div className="lists-container">
        <TodoList
          todos={todos}
          deleteTodo={deleteTodo}
          toggleCompleted={toggleCompleted}
          editTask={() => {}}   // add this line
        />

        <CompletedTodos todos={todos} toggleCompleted={toggleCompleted} />
      </div>
    </div>
  );
};

export default Tasks;
