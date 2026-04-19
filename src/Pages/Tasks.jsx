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
    socket.on("task:comment", ({ taskId, comment }) => {
      // Deduplicated: skip if comment._id already exists (prevents double-add)
      const addComment = (list) =>
        list.map((t) => {
          if (t._id.toString() !== taskId.toString()) return t;
          const exists = (t.comments || []).some((c) => c._id === comment._id);
          return exists ? t : { ...t, comments: [...(t.comments || []), comment] };
        });
      setTodos((prev) => addComment(prev));
      setSharedWithMe((prev) => addComment(prev));
    });
    socket.on("task:comment-deleted", ({ taskId, commentId }) => {
      const removeComment = (list) =>
        list.map((t) =>
          t._id.toString() !== taskId.toString()
            ? t
            : { ...t, comments: (t.comments || []).filter((c) => c._id !== commentId) }
        );
      setTodos((prev) => removeComment(prev));
      setSharedWithMe((prev) => removeComment(prev));
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
      const { recurEvery, recurTimes, due, ...base } = newTodo;

      if (recurEvery && recurTimes && recurTimes > 1) {
        // Parse the starting due date (mm/dd/yyyy)
        const [m, d, y] = due.split("/").map(Number);
        const startDate = new Date(y, m - 1, d);

        // Create all recurring tasks in sequence
        for (let i = 0; i < recurTimes; i++) {
          const taskDate = new Date(startDate);
          taskDate.setDate(taskDate.getDate() + recurEvery * i);
          const mm = String(taskDate.getMonth() + 1).padStart(2, "0");
          const dd = String(taskDate.getDate()).padStart(2, "0");
          const yyyy = taskDate.getFullYear();
          await axios.post(`${API}/api/tasks`, {
            ...base,
            due: `${mm}/${dd}/${yyyy}`,
            title: recurTimes > 1 ? `${base.title} (${i + 1}/${recurTimes})` : base.title,
          });
        }
      } else {
        await axios.post(`${API}/api/tasks`, { ...base, due });
      }
      // socket task:created handles state update for each task
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
    // Use the _sharedWithMe flag directly — re-looking up in sharedWithMe state fails
    // for completed tasks because they are stripped of the flag during filtering
    const isSharedWithMe = !!todo._sharedWithMe;
    const setterOwn    = (fn) => setTodos(fn);
    const setterShared = (fn) => setSharedWithMe(fn);

    // Optimistic update on both lists (task could be in either)
    const applyUpdate = (prev) =>
      prev.map((t) => t._id === todo._id ? { ...t, completed: !todo.completed } : t);
    setTodos(applyUpdate);
    setSharedWithMe(applyUpdate);

    try {
      await axios.patch(`${API}/api/tasks/${todo._id}`, { completed: !todo.completed });
    } catch {
      // Rollback both lists on failure
      const revert = (prev) => prev.map((t) => t._id === todo._id ? { ...t, completed: todo.completed } : t);
      setTodos(revert);
      setSharedWithMe(revert);
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

  // Merge own + shared-with-me (active only). Mark shared ones with _sharedWithMe flag.
  const filteredOwn = getSortedTodos().filter((todo) =>
    !todo.completed &&
    (todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (todo.description || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterPriority === "all" || todo.priority === filterPriority) &&
    (filterCategory === "all" || todo.category === filterCategory)
  );
  const filteredShared = sharedWithMe.filter((todo) =>
    !todo.completed &&
    (todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (todo.description || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterPriority === "all" || todo.priority === filterPriority) &&
    (filterCategory === "all" || todo.category === filterCategory)
  ).map((t) => ({ ...t, _sharedWithMe: true }));
  const filteredTodos = [...filteredOwn, ...filteredShared];

  const PRIORITY_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
  const CATEGORY_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6"];

  return (
    <div>
      <h1 className="page-title">My Tasks</h1>

      {/* Edit modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={saveEditedTask}
          onCancel={() => setEditingTask(null)}
          API={API}
          currentUser={user}
          onDeleteComment={async (commentId) => {
            try {
              await axios.delete(`${API}/api/tasks/${editingTask._id}/comments/${commentId}`);
              // socket task:comment-deleted keeps editingTask.comments in sync via state
            } catch (err) {
              alert(err.response?.data?.message || 'Failed to delete comment.');
            }
          }}
          comments={
            // Always use live comments from state so the modal stays in sync after deletes
            (todos.find((t) => t._id === editingTask._id) ||
             sharedWithMe.find((t) => t._id === editingTask._id) ||
             editingTask
            ).comments || []
          }
        />
      )}

      {/* Controls bar — reminders + export/import */}
      <div className="controls-bar">
        <div className="controls-left">
          <div className="controls-group">
            <span className="controls-icon">🔔</span>
            <label>Remind within</label>
            <select className="controls-days-input" value={reminderMode} onChange={(e) => handleReminderModeChange(e.target.value)} style={{ width: "auto" }}>
              {[1, 3, 5, 7].map((d) => (<option key={d} value={String(d)}>{d}d</option>))}
              <option value="custom">Custom</option>
            </select>
            {reminderMode === "custom" && (
              <>
                <input type="number" min="1" value={customDays} onChange={(e) => setCustomDays(e.target.value)} className="controls-days-input" placeholder="days" />
                <button onClick={handleCustomDaysSubmit} className="controls-btn controls-btn--primary">Set</button>
              </>
            )}
          </div>
        </div>
        <div className="controls-right">
          <button onClick={exportTasks} className="controls-btn controls-btn--outline">Export</button>
          <button onClick={() => { setShowImport(!showImport); setImportError(""); }} className="controls-btn controls-btn--ghost">
            {showImport ? "Cancel Import" : "Import"}
          </button>
        </div>
        {showImport && (
          <div className="controls-import">
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste exported JSON here..." rows={4} />
            {importError && <span className="controls-import-error">{importError}</span>}
            <div className="controls-import-actions">
              <button onClick={importTasks} className="controls-btn controls-btn--primary">Confirm Import</button>
              <button onClick={() => { setShowImport(false); setImportError(""); }} className="controls-btn controls-btn--ghost">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notification-banner">
          <strong>⏰ Upcoming Deadlines</strong>
          <ul>
            {notifications.map((todo) => (<li key={todo._id}><strong>{todo.title}</strong> — due {todo.due}</li>))}
          </ul>
        </div>
      )}

      {/* Undo delete */}
      {lastDeleted && (
        <div className="undo-banner">
          <span>🗑 <strong>{lastDeleted.title}</strong> was deleted.</span>
          <button className="btn-undo" onClick={undoDelete}>Undo</button>
        </div>
      )}

      {/* Progress */}
      <div className="progress-wrap">
        <div className="progress-label">
          <span>Overall Completion</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      {/* Stats */}
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
            {priorityStats.map(({ label, total, done }) => (
              <div key={label} className="breakdown-row">
                <span className="breakdown-dot" style={{ background: PRIORITY_COLORS[label] || "#ccc" }} />
                <span className="breakdown-label">{label}</span>
                <div className="breakdown-bar-wrap">
                  <div className="breakdown-bar" style={{ width: total ? `${(done/total)*100}%` : "0%", background: PRIORITY_COLORS[label] }} />
                </div>
                <span className="breakdown-count">{done}/{total}</span>
              </div>
            ))}
          </div>
          <div className="breakdown-group">
            <h4>By Category</h4>
            {categoryStats.map(({ label, total, done }, i) => (
              <div key={label} className="breakdown-row">
                <span className="breakdown-dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                <span className="breakdown-label">{label}</span>
                <div className="breakdown-bar-wrap">
                  <div className="breakdown-bar" style={{ width: total ? `${(done/total)*100}%` : "0%", background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                </div>
                <span className="breakdown-count">{done}/{total}</span>
              </div>
            ))}
          </div>
        </div>
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
          todos={[...todos, ...sharedWithMe.map((t) => ({ ...t, _sharedWithMe: true }))]}
          toggleCompleted={toggleCompleted}
          editTask={editTask}
          currentUserId={user?.userId}
          onCommentAdded={(taskId, text) => {
            // Fire-and-forget — socket handles state update
            axios.post(`${API}/api/tasks/${taskId}/comments`, { text }).catch((err) =>
              alert(err.response?.data?.message || 'Failed to post comment.')
            );
          }}
          onCommentDeleted={(taskId, commentId) => {
            // Fire-and-forget — socket handles state removal
            axios.delete(`${API}/api/tasks/${taskId}/comments/${commentId}`).catch((err) =>
              alert(err.response?.data?.message || 'Failed to delete comment.')
            );
          }}
        />
      </div>
    </div>
  );
};

// ── Edit Task Modal ────────────────────────────────────────────────────────────
const EditTaskModal = ({ task, onSave, onCancel, API, currentUser, comments = [], onDeleteComment }) => {
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
    task.assignedTo?.userId
      ? { _id: task.assignedTo.userId, name: task.assignedTo.name, email: task.assignedTo.email }
      : currentUser ? { _id: currentUser.userId, name: currentUser.name, email: currentUser.email } : null
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

          {/* Comments section — owner can delete any comment, no editing allowed */}
          {(
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "8px" }}>
                Comments ({comments.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                {comments.length === 0 && (
                  <p style={{ fontSize: "13px", color: "#aaa", margin: 0 }}>No comments yet.</p>
                )}
                {comments.map((c) => (
                  <div key={c._id} style={{ background: "#f7f7fb", borderRadius: "8px", padding: "8px 12px", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                      <span style={{ fontWeight: "600", fontSize: "12px", color: "#444" }}>
                        {c.name}
                        {c.userId?.toString() === currentUser?.userId?.toString() && (
                          <span style={{ marginLeft: "5px", fontSize: "10px", background: "#667eea", color: "#fff", padding: "1px 5px", borderRadius: "8px" }}>you</span>
                        )}
                      </span>
                      <span style={{ fontSize: "11px", color: "#aaa" }}>
                        {new Date(c.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#333", whiteSpace: "pre-wrap" }}>{c.text}</p>
                    {/* Owner can delete any comment — no edit allowed */}
                    <button
                      type="button"
                      onClick={() => { if (window.confirm("Delete this comment?")) onDeleteComment(c._id); }}
                      style={{ position: "absolute", top: "6px", right: "8px", background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "15px", lineHeight: 1 }}
                      title="Delete comment"
                    >×</button>
                  </div>
                ))}
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
