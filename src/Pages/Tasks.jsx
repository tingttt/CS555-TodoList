import React, { useState, useEffect } from "react";
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
      priority: "high",
      category: "personal",
      assignedTo: "Fernando",
      completed: false,
    },
    {
      id: 2,
      title: "Buy 2 Apple",
      description: "On the second day of the month, buy two apples",
      due: "3/15/2023",
      priority: "medium",
      category: "personal",
      assignedTo: "Fernando",
      completed: false,
    },
    {
      id: 3,
      title: "Buy 3 Apple",
      description: "On the third day of the month, buy three apples",
      due: "12/31/2026",
      priority: "low",
      category: "personal",
      assignedTo: "",
      completed: false,
    },
    {
      id: 4,
      title: "Buy 4 Apple",
      description: "On the fourth day of the month, buy four apples",
      due: "12/31/2026",
      priority: "high",
      category: "work",
      assignedTo: "Fernando",
      completed: false,
    },
    {
      id: 5,
      title: "Buy 5 Apple",
      description: "On the fifth day of the month, buy five apples",
      due: "12/31/2026",
      priority: "medium",
      category: "health",
      assignedTo: "",
      completed: false,
    },
    {
      id: 6,
      title: "Buy 6 Apple",
      description: "Pay the cable bill by the 15th of the month",
      due: "3/15/2023",
      priority: "high",
      category: "finance",
      assignedTo: "Fernando",
      completed: false,
    },
    {
      id: 7,
      title: "Buy 7 Apple",
      description: "Pay the cable bill by the 15th of the month",
      due: "12/31/2026",
      priority: "low",
      category: "finance",
      assignedTo: "",
      completed: false,
    },
    {
      id: 8,
      title: "Buy 8 Apple",
      description: "Pay the cable bill by the 15th of the month",
      due: "3/15/2023",
      priority: "medium",
      category: "work",
      assignedTo: "Fernando",
      completed: false,
    },
    {
      id: 9,
      title: "Buy 9 Apple",
      description: "On the ninth day of the month, buy nine apples",
      due: "12/31/2026",
      priority: "low",
      category: "learn",
      assignedTo: "",
      completed: false,
    },
    {
      id: 10,
      title: "Buy 10 Apple",
      description: "On the tenth day of the month, buy ten apples",
      priority: "low",
      category: "work",
      assignedTo: "Fernando",
      due: "12/31/2026",
      completed: false,
    },
  ];
  const [todos, setTodos] = useState(hardcodedBuyApple); // first set todos with initial valu hardcoded data

  const [nextId, setNextId] = useState(hardcodedBuyApple.length + 1); // Start from 11 for add toDOs

  const [sortBy, setSortBy] = useState("none");

  const [searchQuery, setSearchQuery] = useState("");

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const upcoming = todos.filter((todo) => {
      if (todo.completed) return false;
      const [m, d, y] = todo.due.split("/").map(Number);
      const dueDate = new Date(y, m - 1, d);
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = (dueDate - today) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 3;
    });
    setNotifications(upcoming);
  }, []);

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

  const completionPercentage = todos.length === 0 ? 0 : Math.round(
    (todos.filter((todo) => todo.completed).length / todos.length) * 100
  );

  const addTodo = (newTodo) => {
    const todoWithId = { id: nextId, ...newTodo };
    setTodos([...todos, todoWithId]);
    setNextId(nextId + 1);
  };

  const getSortedTodos = () => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const sorted = [...todos];

    if (sortBy === "due-asc") {
      sorted.sort((a, b) => {
        const [am, ad, ay] = a.due.split("/").map(Number);
        const [bm, bd, by] = b.due.split("/").map(Number);
        return new Date(ay, am - 1, ad) - new Date(by, bm - 1, bd);
      });
    } else if (sortBy === "due-desc") {
      sorted.sort((a, b) => {
        const [am, ad, ay] = a.due.split("/").map(Number);
        const [bm, bd, by] = b.due.split("/").map(Number);
        return new Date(by, bm - 1, bd) - new Date(ay, am - 1, ad);
      });
    } else if (sortBy === "priority") {
      sorted.sort(
        (a, b) =>
          (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
      );
    } else if (sortBy === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;

  };

  return (
    <div>
      <h1>Task Page</h1>
      {notifications.length > 0 && (
        <div style={{
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "16px",
        }}>
          <strong>⏰ Upcoming Deadlines:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
            {notifications.map((todo) => (
              <li key={todo.id}>
                <strong>{todo.title}</strong> — due {todo.due}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginBottom: "16px" }}>
        <p>Overall Completion: {completionPercentage}%</p>
        <div style={{
          background: "#e0e0e0",
          borderRadius: "8px",
          height: "12px",
          width: "100%"
        }}>
          <div style={{
            background: completionPercentage === 100 ? "#28a745" : "#667eea",
            width: `${completionPercentage}%`,
            height: "100%",
            borderRadius: "8px",
            transition: "width 0.3s ease"
          }} />
        </div>
      </div>
      <AddTodo addTodo={addTodo} />
      <div className="lists-container">
        <TodoList
          todos={getSortedTodos().filter((todo) =>
            todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            todo.description.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          deleteTodo={deleteTodo}
          toggleCompleted={toggleCompleted}
          editTask={() => {}}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <CompletedTodos todos={todos} toggleCompleted={toggleCompleted} />
      </div>
    </div>
  );
};

export default Tasks;
