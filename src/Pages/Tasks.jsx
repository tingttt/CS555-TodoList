import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import TodoList from "../components/TodoList";
import CompletedTodos from "../components/CompletedTodos";
import AddTodo from "../components/AddTodo";
import MemberSearch from "../components/MemberSearch";
import { useAuth } from "../context/AuthContext";

const Tasks = () => {
  const { user, API, updateUser } = useAuth();
  const [todos, setTodos] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);   // tasks others shared with me
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(user?.sortBy || "smart");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastDeleted, setLastDeleted] = useState(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [reminderDays, setReminderDays] = useState(user?.reminderDays || 3);
  const [reminderMode, setReminderMode] = useState(() => {
    const saved = user?.reminderDays || 3;
    return [1, 3, 5, 7].includes(saved) ? String(saved) : "custom";
  });
  const [customDays, setCustomDays] = useState(() => {
    const saved = user?.reminderDays || 3;
    return [1, 3, 5, 7].includes(saved) ? "" : String(saved);
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/tasks`),
      axios.get(`${API}/api/tasks/shared-with-me`),
    ]).then(([myRes, sharedRes]) => {
      setTodos(myRes.data);
      setSharedWithMe(sharedRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [API]);

  // ── Socket.io ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(API, { withCredentials: true });

    socket.on("task:created", (task) => {
      setTodos((prev) => prev.find((t) => t._id === task._id) ? prev : [...prev, task]);
    });
    socket.on("task:updated", (updated) => {
      // Could be in my tasks or shared-with-me
      setTodos((prev) => prev.map((t) => t._id === updated._id ? updated : t));
      setSharedWithMe((prev) => prev.map((t) => t._id === updated._id ? updated : t));
    });
    socket.on("task:deleted", ({ _id }) => {
      setTodos((prev) => prev.filter((t) => t._id !== _id));
      setSharedWithMe((prev) => prev.filter((t) => t._id !== _id));
    });
    socket.on("task:reordered", ({ orderedIds }) => {
      setTodos((prev) => {
        const map = Object.fromEntries(prev.map((t) => [t._id, t]));
        const reordered = orderedIds.map((id) => map[id]).filter(Boolean);
        const rest = prev.filter((t) => !orderedIds.includes(t._id));
        return [...reordered, ...rest];
      });
    });
    socket.on("task:shared-with-me", (task) => {
      setSharedWithMe((prev) => prev.find((t) => t._id === task._id) ? prev : [task, ...prev]);
    });

    return () => socket.disconnect();
  }, [API]);

  // ── Reminders ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const allTasks = [...todos, ...sharedWithMe];
    const upcoming = allTasks.filter((todo) => {
      if (todo.completed || !todo.due) return false;
      try {
        const [m, d, y] = todo.due.split("/").map(Number);
        const dueDate = new Date(y, m - 1, d); dueDate.setHours(0, 0, 0, 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const diffDays = (dueDate - today) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= reminderDays;
      } catch { return false; }
    });
    setNotifications(upcoming);
  }, [todos, sharedWithMe, reminderDays]);

  // ── Preferences ───────────────────────────────────────────────────────────
  const handleSortChange = (value) => {
    setSortBy(value);
    axios.patch(`${API}/api/profile`, { sortBy: value }).catch(console.error);
    updateUser({ sortBy: value });
  };
  const updateReminderDays = (days) => {
    setReminderDays(days);
    axios.patch(`${API}/api/profile`, { reminderDays: days }).catch(console.error);
    updateUser({ reminderDays: days });
  };
  const handleReminderModeChange = (mode) => {
    setReminderMode(mode);
    if (mode !== "custom") updateReminderDays(Number(mode));
  };
  const handleCustomDaysSubmit = () => {
    const val = parseInt(customDays);
    if (!isNaN(val) && val > 0) updateReminderDays(val);
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const addTodo = async (newTodo) => {
    try {
      await axios.post(`${API}/api/tasks`, newTodo);
      // socket task:created handles state update
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add task.");
    }
  };

  const deleteTodo = async (id) => {
    const todo = todos.find((t) => t._id === id);
    setLastDeleted(todo);
    setTodos((prev) => prev.filter((t) => t._id !== id));
    try {
      await axios.delete(`${API}/api/tasks/${id}`);
    } catch {
      setTodos((prev) => [...prev, todo]);
      setLastDeleted(null);
      alert("Failed to delete task.");
    }
  };

  const undoDelete = async () => {
    if (!lastDeleted) return;
    try {
      await axios.post(`${API}/api/tasks`, lastDeleted);
      setLastDeleted(null);
    } catch { alert("Failed to restore task."); }
  };

  const toggleCompleted = async (todo) => {
    const isSharedWithMe = sharedWithMe.find((t) => t._id === todo._id);
    const setter = isSharedWithMe ? setSharedWithMe : setTodos;
    setter((prev) => prev.map((t) => t._id === todo._id ? { ...t, completed: !todo.completed } : t));
    try {
      await axios.patch(`${API}/api/tasks/${todo._id}`, { completed: !todo.completed });
    } catch {
      setter((prev) => prev.map((t) => t._id === todo._id ? todo : t));
    }
  };

  const editTask = (task) => setEditingTask({ ...task });

  const saveEditedTask = async (updatedFields) => {
    try {
      await axios.patch(`${API}/api/tasks/${editingTask._id}`, updatedFields);
      setEditingTask(null);
      // socket task:updated handles state
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update task.");
    }
  };

  // ── Bulk ───────────────────────────────────────────────────────────────────
  const bulkComplete = async () => {
    const ids = [...selectedIds];
    setTodos((prev) => prev.map((t) => ids.includes(t._id) ? { ...t, completed: true } : t));
    setSelectedIds([]);
    await Promise.all(ids.map((id) => axios.patch(`${API}/api/tasks/${id}`, { completed: true }).catch(console.error)));
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected task(s)?`)) return;
    const ids = [...selectedIds];
    setTodos((prev) => prev.filter((t) => !ids.includes(t._id)));
    setSelectedIds([]);
    await Promise.all(ids.map((id) => axios.delete(`${API}/api/tasks/${id}`).catch(console.error)));
  };

  // ── Reorder ────────────────────────────────────────────────────────────────
  const reorderTodos = async (fromId, toId) => {
    const list = getSortedTodos().filter((t) => !t.completed);
    const fromIdx = list.findIndex((t) => t._id === fromId);
    const toIdx = list.findIndex((t) => t._id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const reordered = [...list];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setTodos([...reordered, ...todos.filter((t) => t.completed)]);
    handleSortChange("none");
    try {
      await axios.post(`${API}/api/tasks/reorder`, { orderedIds: reordered.map((t) => t._id) });
    } catch (err) { console.error("Reorder failed", err); }
  };

  // ── Export / Import ────────────────────────────────────────────────────────
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const exportTasks = () => {
    const data = JSON.stringify(todos.map(({ _id, userId, createdAt, updatedAt, __v, ...rest }) => rest), null, 2);
    navigator.clipboard.writeText(data);
    alert("Task list copied to clipboard!");
  };

  const importTasks = async () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("Invalid format");
      for (const t of parsed) {
        await axios.post(`${API}/api/tasks`, {
          title: t.title, description: t.description, due: t.due,
          priority: t.priority, category: t.category, assignedTo: t.assignedTo,
        });
      }
      setImportText(""); setShowImport(false); setImportError("");
    } catch (err) { setImportError(err.message || "Import failed."); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const allTodos = [...todos, ...sharedWithMe];
  const completionPercentage = allTodos.length === 0 ? 0 : Math.round((allTodos.filter((t) => t.completed).length / allTodos.length) * 100);
  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = todos.length - completedCount;

  const priorityStats = ["high", "medium", "low"].map((p) => {
    const group = todos.filter((t) => t.priority === p);
    return { label: p, total: group.length, done: group.filter((t) => t.completed).length };
  });
  const categoryStats = [...new Set(todos.map((t) => t.category).filter(Boolean))].map((c) => {
    const group = todos.filter((t) => t.category === c);
    return { label: c, total: group.length, done: group.filter((t) => t.completed).length };
  });

  // ── Sorting ────────────────────────────────────────────────────────────────
  const getSortedTodos = () => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const sorted = [...todos];
    const parseDate = (due) => { if (!due) return Infinity; const [m, d, y] = due.split("/").map(Number); return new Date(y, m - 1, d).getTime(); };
    if (sortBy === "due-asc") sorted.sort((a, b) => parseDate(a.due) - parseDate(b.due));
    else if (sortBy === "due-desc") sorted.sort((a, b) => parseDate(b.due) - parseDate(a.due));
    else if (sortBy === "priority") sorted.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99));
    else if (sortBy === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "smart") sorted.sort((a, b) => {
      const diff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
      return diff !== 0 ? diff : parseDate(a.due) - parseDate(b.due);
    });
    return sorted;
  };

  if (loading) return <div style={{ padding: "32px", textAlign: "center" }}>Loading tasks…</div>;

  const filteredTodos = getSortedTodos().filter((todo) =>
    !todo.completed &&
    (todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (todo.description || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterPriority === "all" || todo.priority === filterPriority) &&
    (filterCategory === "all" || todo.category === filterCategory)
  );

  return (
    <div>
      <h1>My Tasks</h1>

      {/* Edit modal */}
      {editingTask && (
        <EditTaskModal task={editingTask} onSave={saveEditedTask} onCancel={() => setEditingTask(null)} API={API} />
      )}

      {/* Reminder selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", color: "#555" }}>Remind me about tasks due within:</span>
        <select value={reminderMode} onChange={(e) => handleReminderModeChange(e.target.value)} style={{ padding: "3px 8px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "13px" }}>
          {[1, 3, 5, 7].map((d) => (<option key={d} value={String(d)}>{d} day{d > 1 ? "s" : ""}</option>))}
          <option value="custom">Custom</option>
        </select>
        {reminderMode === "custom" && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input type="number" min="1" value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="days" style={{ width: "60px", padding: "3px 6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "13px" }} />
            <button onClick={handleCustomDaysSubmit} style={{ padding: "3px 10px", borderRadius: "4px", background: "#667eea", color: "#fff", border: "none", fontSize: "13px", cursor: "pointer" }}>Set</button>
          </div>
        )}
        <span style={{ fontSize: "12px", color: "#999" }}>(currently: {reminderDays} day{reminderDays > 1 ? "s" : ""})</span>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
          <strong>⏰ Upcoming Deadlines:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
            {notifications.map((todo) => (<li key={todo._id}><strong>{todo.title}</strong> — due {todo.due}</li>))}
          </ul>
        </div>
      )}

      {/* Undo delete */}
      {lastDeleted && (
        <div style={{ background: "#d1ecf1", border: "1px solid #bee5eb", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🗑 <strong>{lastDeleted.title}</strong> was deleted.</span>
          <button onClick={undoDelete} style={{ background: "#17a2b8", color: "white", border: "none", borderRadius: "4px", padding: "6px 14px", cursor: "pointer" }}>Undo</button>
        </div>
      )}

      {/* Progress */}
      <div style={{ marginBottom: "16px" }}>
        <p>Overall Completion: {completionPercentage}%</p>
        <div style={{ background: "#e0e0e0", borderRadius: "8px", height: "12px", width: "100%" }}>
          <div style={{ background: completionPercentage === 100 ? "#28a745" : "#667eea", width: `${completionPercentage}%`, height: "100%", borderRadius: "8px", transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          {[{ label: "Total", value: todos.length }, { label: "Completed", value: completedCount }, { label: "Pending", value: pendingCount }].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, textAlign: "center", padding: "12px", background: "#f5f5f5", borderRadius: "8px", border: "1px solid #ddd" }}>
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
                <span style={{ textTransform: "capitalize" }}>{label}</span><span>{done} / {total}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "13px" }}>By Category</strong>
            {categoryStats.map(({ label, total, done }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "2px 0" }}>
                <span style={{ textTransform: "capitalize" }}>{label}</span><span>{done} / {total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export / Import */}
      <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={exportTasks} style={{ padding: "6px 14px", borderRadius: "4px", border: "1px solid #667eea", color: "#667eea", background: "none", cursor: "pointer" }}>Export Tasks</button>
          <button onClick={() => { setShowImport(!showImport); setImportError(""); }} style={{ padding: "6px 14px", borderRadius: "4px", border: "1px solid #667eea", color: "#667eea", background: "none", cursor: "pointer" }}>Import Tasks</button>
        </div>
        {showImport && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste exported JSON here..." rows={5} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "monospace", fontSize: "12px" }} />
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
          todos={filteredTodos}
          deleteTodo={deleteTodo}
          toggleCompleted={toggleCompleted}
          editTask={editTask}
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
        <CompletedTodos
          todos={todos}
          toggleCompleted={toggleCompleted}
          onTaskUpdated={(updated) => setTodos((prev) => prev.map((t) => t._id === updated._id ? updated : t))}
        />
      </div>

      {/* Shared With Me section */}
      {sharedWithMe.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>🔗 Shared With Me</h2>
          {sharedWithMe.filter((t) => !t.completed).map((todo) => (
            <SharedTaskRow key={todo._id} todo={todo} toggleCompleted={toggleCompleted} editTask={editTask} API={API} />
          ))}
          {sharedWithMe.filter((t) => t.completed).length > 0 && (
            <details style={{ marginTop: "12px" }}>
              <summary style={{ cursor: "pointer", color: "#888", fontSize: "14px" }}>Completed shared tasks ({sharedWithMe.filter((t) => t.completed).length})</summary>
              {sharedWithMe.filter((t) => t.completed).map((todo) => (
                <SharedTaskRow key={todo._id} todo={todo} toggleCompleted={toggleCompleted} editTask={editTask} API={API} />
              ))}
            </details>
          )}
        </div>
      )}
    </div>
  );
};

// ── Shared-with-me task row ────────────────────────────────────────────────────
const SharedTaskRow = ({ todo, toggleCompleted, editTask }) => {
  const priorityColor = { high: "#dc3545", medium: "#fd7e14", low: "#28a745" };
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderLeft: `4px solid ${priorityColor[todo.priority] || "#ccc"}`, borderRadius: "8px", padding: "14px 16px", marginBottom: "10px", opacity: todo.completed ? 0.7 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "15px", textDecoration: todo.completed ? "line-through" : "none" }}>{todo.title}</h3>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>
            Shared by <strong>{todo.userId?.name || "someone"}</strong>
            {todo.due && <> · Due {todo.due}</>}
            {todo.assignedTo?.name && <> · Assigned to <strong>{todo.assignedTo.name}</strong></>}
          </div>
          {todo.description && <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#444" }}>{todo.description}</p>}
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button onClick={() => toggleCompleted(todo)} style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "4px", border: "1px solid #28a745", color: "#28a745", background: "none", cursor: "pointer" }}>
            {todo.completed ? "Reopen" : "Complete"}
          </button>
          <button onClick={() => editTask(todo)} style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "4px", border: "1px solid #667eea", color: "#667eea", background: "none", cursor: "pointer" }}>Edit</button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Task Modal ────────────────────────────────────────────────────────────
const EditTaskModal = ({ task, onSave, onCancel, API }) => {
  const getToday = () => new Date().toISOString().split("T")[0];
  const toInputDate = (due) => {
    if (!due) return getToday();
    const parts = due.split("/");
    if (parts.length !== 3) return getToday();
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  };
  const fromInputDate = (val) => { const [y, m, d] = val.split("-"); return `${m}/${d}/${y}`; };

  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    due: toInputDate(task.due),
    priority: task.priority || "low",
    category: task.category || "",
  });
  const [assignedTo, setAssignedTo] = useState(
    task.assignedTo?.userId ? { _id: task.assignedTo.userId, name: task.assignedTo.name, email: task.assignedTo.email } : null
  );
  const [isShared, setIsShared] = useState(task.isShared || false);
  const [sharedWith, setSharedWith] = useState(
    (task.sharedWith || []).map((u) => ({ _id: u.userId, name: u.name, email: u.email }))
  );
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    onSave({
      ...form,
      due: fromInputDate(form.due),
      assignedTo: assignedTo ? { userId: assignedTo._id, name: assignedTo.name, email: assignedTo.email } : null,
      isShared,
      sharedWith: sharedWith.map((u) => ({ userId: u._id, name: u.name, email: u.email })),
    });
  };

  const overlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, overflowY: "auto", padding: "20px" };
  const modalStyle = { background: "#fff", borderRadius: "12px", padding: "28px 32px", width: "100%", maxWidth: "520px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" };
  const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box" };
  const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#555", display: "block", marginBottom: "4px" };
  const fieldStyle = { marginBottom: "14px" };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>Edit Task</h3>
        {error && <p style={{ color: "red", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Title</label>
            <input name="title" value={form.title} onChange={handleChange} style={inputStyle} required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Due Date</label>
              <input type="date" name="due" value={form.due} onChange={handleChange} min={getToday()} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
                <option value="">No category</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="finance">Finance</option>
                <option value="learn">Learning</option>
              </select>
            </div>
          </div>

          {/* Assign To */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Assign To</label>
            {assignedTo ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", background: "#e8e8ff", borderRadius: "6px", fontSize: "14px" }}>
                <span>👤 <strong>{assignedTo.name}</strong> <span style={{ color: "#888", fontSize: "12px" }}>{assignedTo.email}</span></span>
                <button type="button" onClick={() => setAssignedTo(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "16px" }}>×</button>
              </div>
            ) : (
              <MemberSearch onAdd={(u) => setAssignedTo(u)} excludeIds={[]} />
            )}
          </div>

          {/* Share toggle */}
          <div style={{ ...fieldStyle, display: "flex", alignItems: "center", gap: "10px" }}>
            <input type="checkbox" id="editIsShared" checked={isShared} onChange={(e) => { setIsShared(e.target.checked); if (!e.target.checked) setSharedWith([]); }} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
            <label htmlFor="editIsShared" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>Share this task</label>
          </div>

          {isShared && (
            <div style={{ ...fieldStyle, background: "#f7f7fb", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "12px" }}>
              <label style={labelStyle}>Shared With</label>
              <MemberSearch
                onAdd={(u) => { if (!sharedWith.find((s) => s._id === u._id)) setSharedWith((prev) => [...prev, u]); }}
                excludeIds={sharedWith.map((u) => u._id)}
              />
              {sharedWith.length > 0 && (
                <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {sharedWith.map((u) => (
                    <span key={u._id} style={{ background: "#e8e8ff", padding: "4px 10px", borderRadius: "20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                      {u.name}
                      <button type="button" onClick={() => setSharedWith((prev) => prev.filter((s) => s._id !== u._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "15px", padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                  Or share a link: <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/shared/${task._id}`); alert("Link copied!"); }} style={{ background: "none", border: "none", color: "#667eea", cursor: "pointer", fontSize: "12px", textDecoration: "underline", padding: 0 }}>Copy invite link 🔗</button>
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
            <button type="button" onClick={onCancel} style={{ padding: "8px 20px", borderRadius: "6px", border: "1px solid #ccc", background: "#f5f5f5", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
            <button type="submit" style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#667eea", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tasks;
