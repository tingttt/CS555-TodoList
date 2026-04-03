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
  const [myName, setMyName] = useState(() => localStorage.getItem("myName") || "");
  const [nameInput, setNameInput] = useState("");
  const [showMyTasks, setShowMyTasks] = useState(false);

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      localStorage.setItem("myName", trimmed);
      setMyName(trimmed);
      setNameInput("");
    }
  };

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const exportTasks = () => {
    const data = JSON.stringify(todos, null, 2);
    navigator.clipboard.writeText(data);
    alert("Task list copied to clipboard!");
  };

  const importTasks = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("Invalid format");
      const maxId = todos.reduce((max, t) => Math.max(max, t.id), 0);
      const newTasks = parsed.map((t, i) => ({ ...t, id: maxId + i + 1 }));
      setTodos([...todos, ...newTasks]);
      setNextId(maxId + newTasks.length + 1);
      setImportText("");
      setShowImport(false);
      setImportError("");
    } catch {
      setImportError("Invalid JSON. Please paste a valid exported task list.");
    }
  };

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

  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = todos.length - completedCount;

  const priorityStats = ["high", "medium", "low"].map((p) => {
    const group = todos.filter((t) => t.priority === p);
    const done = group.filter((t) => t.completed).length;
    return { label: p, total: group.length, done };
  });

  const categoryStats = [...new Set(todos.map((t) => t.category))].map((c) => {
    const group = todos.filter((t) => t.category === c);
    const done = group.filter((t) => t.completed).length;
    return { label: c, total: group.length, done };
  });

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
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          {[
            { label: "Total", value: todos.length },
            { label: "Completed", value: completedCount },
            { label: "Pending", value: pendingCount },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: 1, textAlign: "center", padding: "12px",
              background: "#f5f5f5", borderRadius: "8px", border: "1px solid #ddd"
            }}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{value}</div>
              <div style={{ fontSize: "13px", color: "#666" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "13px" }}>By Priority</strong>
            {priorityStats.map(({ label, total, done }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "2px 0" }}>
                <span style={{ textTransform: "capitalize" }}>{label}</span>
                <span>{done} / {total}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "13px" }}>By Category</strong>
            {categoryStats.map(({ label, total, done }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "2px 0" }}>
                <span style={{ textTransform: "capitalize" }}>{label}</span>
                <span>{done} / {total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        {!myName ? (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "13px" }}>Your name:</span>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name to filter shared tasks"
              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
            <button onClick={saveName} style={{ padding: "4px 12px" }}>Save</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setShowMyTasks(false)}
              style={{ padding: "4px 12px", background: !showMyTasks ? "#667eea" : "#e0e0e0", color: !showMyTasks ? "#fff" : "#333", border: "none", borderRadius: "4px" }}
            >
              All Tasks
            </button>
            <button
              onClick={() => setShowMyTasks(true)}
              style={{ padding: "4px 12px", background: showMyTasks ? "#667eea" : "#e0e0e0", color: showMyTasks ? "#fff" : "#333", border: "none", borderRadius: "4px" }}
            >
              My Tasks ({todos.filter((t) => !t.completed && t.assignedTo === myName).length})
            </button>
            <span style={{ fontSize: "13px", color: "#666" }}>Viewing as: {myName}</span>
            <button onClick={() => { localStorage.removeItem("myName"); setMyName(""); setShowMyTasks(false); }} style={{ fontSize: "12px", color: "#999", background: "none", border: "none", cursor: "pointer" }}>change</button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={exportTasks} style={{ padding: "6px 14px", borderRadius: "4px", border: "1px solid #667eea", color: "#667eea", background: "none", cursor: "pointer" }}>
            Export Tasks
          </button>
          <button onClick={() => { setShowImport(!showImport); setImportError(""); }} style={{ padding: "6px 14px", borderRadius: "4px", border: "1px solid #667eea", color: "#667eea", background: "none", cursor: "pointer" }}>
            Import Tasks
          </button>
        </div>
        {showImport && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste exported JSON here..."
              rows={5}
              style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "monospace", fontSize: "12px" }}
            />
            {importError && <span style={{ color: "red", fontSize: "13px" }}>{importError}</span>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={importTasks} style={{ padding: "4px 12px", background: "#667eea", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Confirm Import</button>
              <button onClick={() => { setShowImport(false); setImportError(""); }} style={{ padding: "4px 12px", background: "#e0e0e0", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <AddTodo addTodo={addTodo} />
      <div className="lists-container">
        <TodoList
          todos={getSortedTodos().filter((todo) =>
            (todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            todo.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (!showMyTasks || todo.assignedTo === myName)
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
