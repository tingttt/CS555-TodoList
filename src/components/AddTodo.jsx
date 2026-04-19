import React, { useState } from "react";
import validation from "../utils/validation";
import MemberSearch from "./MemberSearch";
import { useAuth } from "../context/AuthContext";

const getToday = () => new Date().toISOString().split("T")[0];

const convertDate = (dateString) => {
  const [year, month, day] = dateString.split("-");
  return `${month}/${day}/${year}`;
};

const AddTodo = ({ addTodo }) => {
  const { user } = useAuth();
  const selfUser = user ? { _id: user.userId, name: user.name, email: user.email } : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState(getToday());
  const [priority, setPriority] = useState("low");
  const [category, setCategory] = useState("");
  const [assignedTo, setAssignedTo] = useState(selfUser);
  const [isShared, setIsShared] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    try {
      if (name === "title") validation.checkTitle(value);
      if (name === "description") validation.checkDescription(value);
      if (name === "due") {
        validation.checkDate(convertDate(value), "Due Date");
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [y, m, d] = value.split("-").map(Number);
        if (new Date(y, m - 1, d) < today) throw new Error("Due date must be today or in the future.");
      }
      if (name === "category" && !value) throw new Error("Please select a category.");
      return "";
    } catch (e) { return e.message; }
  };

  const handleBlur = (name, value) => {
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const handleChange = (name, value) => {
    if (name === "title") setTitle(value);
    else if (name === "description") setDescription(value);
    else if (name === "due") setDue(value);
    else if (name === "priority") setPriority(value);
    else if (name === "category") setCategory(value);
    if (touched[name]) setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fields = { title, description, due, category };
    const newErrors = {};
    Object.entries(fields).forEach(([name, value]) => { newErrors[name] = validateField(name, value); });
    setErrors(newErrors);
    setTouched({ title: true, description: true, due: true, category: true });
    if (Object.values(newErrors).some(Boolean)) return;

    addTodo({
      title: title.trim(),
      description: description.trim(),
      due: convertDate(due),
      priority,
      category,
      assignedTo: assignedTo ? { userId: assignedTo._id, name: assignedTo.name, email: assignedTo.email } : null,
      isShared,
      sharedWith: sharedWith.map((u) => ({ userId: u._id, name: u.name, email: u.email })),
      completed: false,
    });

    setTitle(""); setDescription(""); setDue(getToday());
    setPriority("low"); setCategory("");
    setAssignedTo(selfUser); setIsShared(false); setSharedWith([]);
    setErrors({}); setTouched({});
  };

  const removeSharedUser = (id) => setSharedWith((p) => p.filter((u) => u._id !== id));

  return (
    <div className="add-todo-card">
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit} noValidate>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text" value={title}
            onChange={(e) => handleChange("title", e.target.value)}
            onBlur={(e) => handleBlur("title", e.target.value)}
            className={touched.title && errors.title ? "input-error" : ""}
            placeholder="Task title..."
          />
          <div className="field-footer">
            {touched.title && errors.title
              ? <span className="field-error">{errors.title}</span>
              : <span className="field-hint">{title.trim().length}/5 min characters</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => handleChange("description", e.target.value)}
            onBlur={(e) => handleBlur("description", e.target.value)}
            className={touched.description && errors.description ? "input-error" : ""}
            placeholder="What needs to be done?"
          />
          <div className="field-footer">
            {touched.description && errors.description
              ? <span className="field-error">{errors.description}</span>
              : <span className="field-hint">{description.trim().length}/25 min characters</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date" value={due} min={getToday()}
              onChange={(e) => handleChange("due", e.target.value)}
              onBlur={(e) => handleBlur("due", e.target.value)}
              className={touched.due && errors.due ? "input-error" : ""}
            />
            {touched.due && errors.due && <span className="field-error">{errors.due}</span>}
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => handleChange("category", e.target.value)}
            onBlur={(e) => handleBlur("category", e.target.value)}
            className={touched.category && errors.category ? "input-error" : ""}
          >
            <option value="">Select a category</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="health">Health</option>
            <option value="finance">Finance</option>
            <option value="learn">Learning</option>
          </select>
          {touched.category && errors.category && <span className="field-error">{errors.category}</span>}
        </div>

        {/* Assign To — defaults to self */}
        <div className="form-group">
          <label>Assign To <span style={{ fontWeight: 400, textTransform: "none", fontSize: "0.8rem" }}>(defaults to you)</span></label>
          {assignedTo ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "var(--primary-light)", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}>
              <span>👤 <strong>{assignedTo.name}</strong>
                {assignedTo._id === selfUser?._id && <span style={{ fontSize: "0.75rem", color: "var(--primary)", marginLeft: "4px" }}>(you)</span>}
                {" "}<span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{assignedTo.email}</span>
              </span>
              <button type="button" onClick={() => setAssignedTo(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem", lineHeight: 1 }}>×</button>
            </div>
          ) : (
            <MemberSearch onAdd={(u) => setAssignedTo(u)} excludeIds={[]} />
          )}
        </div>

        {/* Share toggle */}
        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox" id="isShared" checked={isShared}
            onChange={(e) => { setIsShared(e.target.checked); if (!e.target.checked) setSharedWith([]); }}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--primary)" }}
          />
          <label htmlFor="isShared" style={{ textTransform: "none", fontSize: "0.9rem", letterSpacing: 0, cursor: "pointer", marginBottom: 0 }}>
            Share this task with others
          </label>
        </div>

        {isShared && (
          <div style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "16px", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Share With</p>
            <MemberSearch
              onAdd={(u) => { if (!sharedWith.find((s) => s._id === u._id)) setSharedWith((p) => [...p, u]); }}
              excludeIds={sharedWith.map((u) => u._id)}
            />
            {sharedWith.length > 0 && (
              <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {sharedWith.map((u) => (
                  <span key={u._id} className="badge badge-assigned" style={{ gap: "6px" }}>
                    {u.name}
                    <button type="button" onClick={() => removeSharedUser(u._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "1rem", padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn-submit">Add Task</button>
      </form>
    </div>
  );
};

export default AddTodo;
