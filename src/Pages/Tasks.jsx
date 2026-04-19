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

  const [sortBy, setSortBy] = useState(() => localStorage.getItem("sortBy") || "smart");

  const handleSortChange = (value) => {
    setSortBy(value);
    localStorage.setItem("sortBy", value);
  };

  const [searchQuery, setSearchQuery] = useState("");

  const [lastDeleted, setLastDeleted] = useState(null);

  const [filterPriority, setFilterPriority] = useState("all");

  const [filterCategory, setFilterCategory] = useState("all");

  const [notifications, setNotifications] = useState([]);
  const [reminderDays, setReminderDays] = useState(() => Number(localStorage.getItem("reminderDays")) || 3);
  const [reminderMode, setReminderMode] = useState(() => {
    const saved = Number(localStorage.getItem("reminderDays")) || 3;
    return [1, 3, 5, 7].includes(saved) ? String(saved) : "custom";
  });
  const [customDays, setCustomDays] = useState(() => {
    const saved = Number(localStorage.getItem("reminderDays")) || 3;
    return [1, 3, 5, 7].includes(saved) ? "" : String(saved);
  });
  const [myName, setMyName] = useState(() => localStorage.getItem("myName") || "");
  const [nameInput, setNameInput] = useState("");
  const [showMyTasks, setShowMyTasks] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);

  const reorderTodos = (fromId, toId) => {
    const list = getSortedTodos().filter((t) => !t.completed);
    const fromIdx = list.findIndex((t) => t.id === fromId);
    const toIdx = list.findIndex((t) => t.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const reordered = [...list];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const completedTodos = todos.filter((t) => t.completed);
    setTodos([...reordered, ...completedTodos]);
    handleSortChange("none");
  };

  const bulkComplete = () => {
    setTodos(todos.map((t) => selectedIds.includes(t.id) ? { ...t, completed: true } : t));
    setSelectedIds([]);
  };

  const bulkDelete = () => {
    if (window.confirm(`Delete ${selectedIds.length} selected task(s)?`)) {
      setTodos(todos.filter((t) => !selectedIds.includes(t.id)));
      setSelectedIds([]);
    }
  };

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

  const updateReminderDays = (days) => {
    setReminderDays(days);
    localStorage.setItem("reminderDays", days);
  };

  const handleReminderModeChange = (mode) => {
    setReminderMode(mode);
    if (mode !== "custom") {
      updateReminderDays(Number(mode));
    }
  };

  const handleCustomDaysSubmit = () => {
    const val = parseInt(customDays);
    if (!isNaN(val) && val > 0) {
      updateReminderDays(val);
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
      return diffDays >= 0 && diffDays <= reminderDays;
    });
    setNotifications(upcoming);
  }, [todos, reminderDays]);

  const deleteTodo = (id) => {
    const todo = todos.find((t) => t.id === id);
    setLastDeleted(todo);
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const undoDelete = () => {
    setTodos([...todos, lastDeleted]);
    setLastDeleted(null);
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
    } else if (sortBy === "smart") {
      sorted.sort((a, b) => {
        const diff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
        if (diff !== 0) return diff;
        const parseDate = (due) => {
          if (!due) return Infinity;
          const [m, d, y] = due.split("/").map(Number);
          return new Date(y, m - 1, d).getTime();
        };
        return parseDate(a.due) - parseDate(b.due);
      });
    }

    return sorted;

  };

  return (
    <div>
      <h1 className="page-title">My Tasks</h1>

      {notifications.length > 0 && (
        <div className="notification-banner">
          <strong>⏰ Upcoming Deadlines</strong>
          <ul>
            {notifications.map((todo) => (
              <li key={todo.id}><strong>{todo.title}</strong> — due {todo.due}</li>
            ))}
          </ul>
        </div>
      )}

      {lastDeleted && (
        <div className="undo-banner">
          <span>🗑 <strong>{lastDeleted.title}</strong> was deleted.</span>
          <button className="btn-undo" onClick={undoDelete}>Undo</button>
        </div>
      )}

      <div className="progress-wrap">
        <div className="progress-label">
          <span>Overall Completion</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      <div className="stats-panel">
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-value">{todos.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card stat-done">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="breakdown-section">
          <div className="breakdown-group">
            <h4>By Priority</h4>
            {[
              { label: "high", color: "#ef4444" },
              { label: "medium", color: "#f59e0b" },
              { label: "low", color: "#22c55e" },
            ].map(({ label, color }) => {
              const stat = priorityStats.find((s) => s.label === label) || { total: 0, done: 0 };
              return (
                <div key={label} className="breakdown-row">
                  <span className="breakdown-dot" style={{ background: color }} />
                  <span className="breakdown-label">{label}</span>
                  <div className="breakdown-bar-wrap">
                    <div className="breakdown-bar" style={{ width: stat.total ? `${(stat.done / stat.total) * 100}%` : "0%", background: color }} />
                  </div>
                  <span className="breakdown-count">{stat.done}/{stat.total}</span>
                </div>
              );
            })}
          </div>
          <div className="breakdown-group">
            <h4>By Category</h4>
            {categoryStats.map(({ label, total, done }, i) => {
              const colors = ["#6366f1", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
              const color = colors[i % colors.length];
              return (
                <div key={label} className="breakdown-row">
                  <span className="breakdown-dot" style={{ background: color }} />
                  <span className="breakdown-label">{label}</span>
                  <div className="breakdown-bar-wrap">
                    <div className="breakdown-bar" style={{ width: total ? `${(done / total) * 100}%` : "0%", background: color }} />
                  </div>
                  <span className="breakdown-count">{done}/{total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="controls-bar">
        <div className="controls-left">
          <div className="controls-group">
            <span className="controls-icon">🔔</span>
            <label>Remind within</label>
            <select value={reminderMode} onChange={(e) => handleReminderModeChange(e.target.value)}>
              {[1, 3, 5, 7].map((d) => (<option key={d} value={String(d)}>{d} day{d > 1 ? "s" : ""}</option>))}
              <option value="custom">Custom</option>
            </select>
            {reminderMode === "custom" && (
              <>
                <input type="number" min="1" value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="days" className="controls-days-input" />
                <button className="controls-btn controls-btn--primary" onClick={handleCustomDaysSubmit}>Set</button>
              </>
            )}
          </div>
          <div className="controls-group">
            <button className="controls-btn controls-btn--outline" onClick={exportTasks}>↑ Export</button>
            <button className="controls-btn controls-btn--outline" onClick={() => { setShowImport(!showImport); setImportError(""); }}>↓ Import</button>
          </div>
        </div>

        <div className="controls-right">
          {!myName ? (
            <>
              <input className="controls-name-input" type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Your name for shared tasks" />
              <button className="controls-btn controls-btn--primary" onClick={saveName}>Save</button>
            </>
          ) : (
            <>
              <button className={`controls-btn ${!showMyTasks ? "controls-btn--primary" : "controls-btn--ghost"}`} onClick={() => setShowMyTasks(false)}>All Tasks</button>
              <button className={`controls-btn ${showMyTasks ? "controls-btn--primary" : "controls-btn--ghost"}`} onClick={() => setShowMyTasks(true)}>
                My Tasks ({todos.filter((t) => !t.completed && t.assignedTo === myName).length})
              </button>
              <button className="controls-btn controls-btn--text" onClick={() => { localStorage.removeItem("myName"); setMyName(""); setShowMyTasks(false); }}>change</button>
            </>
          )}
        </div>

        {showImport && (
          <div className="controls-import">
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste exported JSON here..." rows={4} />
            {importError && <span className="controls-import-error">{importError}</span>}
            <div className="controls-import-actions">
              <button className="controls-btn controls-btn--primary" onClick={importTasks}>Confirm Import</button>
              <button className="controls-btn controls-btn--ghost" onClick={() => { setShowImport(false); setImportError(""); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="three-col-layout">
        <AddTodo addTodo={addTodo} />
        <TodoList
          todos={getSortedTodos().filter((todo) =>
            (todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            todo.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (!showMyTasks || todo.assignedTo === myName) &&
            (filterPriority === "all" || todo.priority === filterPriority) &&
            (filterCategory === "all" || todo.category === filterCategory)
          )}
            deleteTodo={deleteTodo}
            toggleCompleted={toggleCompleted}
            editTask={() => {}}
            sortBy={sortBy}
            setSortBy={handleSortChange}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            bulkComplete={bulkComplete}
            bulkDelete={bulkDelete}
            reorderTodos={reorderTodos}
        />

        <CompletedTodos todos={todos} toggleCompleted={toggleCompleted} />
      </div>
    </div>
  );
};

export default Tasks;
