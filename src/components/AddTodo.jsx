import React, { useState } from "react";
import validation from "../utils/validation";
import MemberSearch from "./MemberSearch";
import { useAuth } from "../context/AuthContext";

const AddTodo = ({ addTodo }) => {
  const { user } = useAuth();
  const getToday = () => new Date().toISOString().split("T")[0];

  // Default assignedTo = logged-in user
  const selfUser = user ? { _id: user.userId, name: user.name, email: user.email } : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState(getToday());
  const [priority, setPriority] = useState("low");
  const [category, setCategory] = useState("");
  const [assignedTo, setAssignedTo] = useState(selfUser);
  const [isShared, setIsShared] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const convertDateFormat = (dateString) => {
      const [year, month, day] = dateString.split("-");
      return `${month}/${day}/${year}`;
    };
    try {
      const validatedTitle = validation.checkTitle(title);
      const formattedDue = convertDateFormat(due);
      const validatedDescription = validation.checkDescription(description);
      const validatedDate = validation.checkDate(formattedDue, "Due Date");
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [m, d, y] = validatedDate.split("/").map(Number);
      const dueDate = new Date(y, m - 1, d); dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today) throw new Error("Due date must be today or in the future.");

      addTodo({
        title: validatedTitle,
        description: validatedDescription,
        due: validatedDate,
        priority,
        category,
        // Send null if no assignedTo so server defaults to creator
        assignedTo: assignedTo ? { userId: assignedTo._id, name: assignedTo.name, email: assignedTo.email } : null,
        isShared,
        sharedWith: sharedWith.map((u) => ({ userId: u._id, name: u.name, email: u.email })),
        completed: false,
      });

      // Reset — re-default assignedTo to self
      setTitle(""); setDescription(""); setDue(getToday());
      setPriority("low"); setCategory("");
      setAssignedTo(selfUser); setIsShared(false); setSharedWith([]); setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const removeSharedUser = (id) => setSharedWith((prev) => prev.filter((u) => u._id !== id));

  const labelStyle = { display: "block", fontWeight: "600", fontSize: "13px", marginBottom: "4px", color: "#444" };
  const inputStyle = { width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box" };
  const fieldStyle = { marginBottom: "12px" };

  const AssignedChip = ({ u, onClear }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", background: "#e8e8ff", borderRadius: "6px", fontSize: "14px" }}>
      <span>👤 <strong>{u.name}</strong>{u._id === selfUser?._id && <span style={{ fontSize: "11px", color: "#667eea", marginLeft: "4px" }}>(you)</span>} <span style={{ color: "#888", fontSize: "12px" }}>{u.email}</span></span>
      <button type="button" onClick={onClear} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "16px" }}>×</button>
    </div>
  );

  return (
    <div style={{ background: "#f7f7fb", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "20px", marginBottom: "24px" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>Add New Task</h2>
      {error && <p style={{ color: "red", fontSize: "13px", marginBottom: "10px" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} required />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} required />
        </div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Due Date</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} min={getToday()} style={inputStyle} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              <option value="">No category</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="learn">Learning</option>
            </select>
          </div>
        </div>

        {/* Assign To — defaults to self, searchable */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Assign To <span style={{ fontWeight: "400", color: "#888" }}>(defaults to you)</span></label>
          {assignedTo ? (
            <AssignedChip u={assignedTo} onClear={() => setAssignedTo(null)} />
          ) : (
            <MemberSearch onAdd={(u) => setAssignedTo(u)} excludeIds={[]} />
          )}
        </div>

        {/* Share toggle */}
        <div style={{ ...fieldStyle, display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox" id="isShared" checked={isShared}
            onChange={(e) => { setIsShared(e.target.checked); if (!e.target.checked) setSharedWith([]); }}
            style={{ width: "16px", height: "16px", cursor: "pointer" }}
          />
          <label htmlFor="isShared" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>Share this task with others</label>
        </div>

        {isShared && (
          <div style={{ ...fieldStyle, background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "12px" }}>
            <label style={labelStyle}>Share With</label>
            <MemberSearch
              onAdd={(u) => { if (!sharedWith.find((s) => s._id === u._id)) setSharedWith((prev) => [...prev, u]); }}
              excludeIds={sharedWith.map((u) => u._id)}
            />
            {sharedWith.length > 0 && (
              <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {sharedWith.map((u) => (
                  <span key={u._id} style={{ background: "#e8e8ff", padding: "4px 10px", borderRadius: "20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {u.name}{u._id === selfUser?._id && <span style={{ fontSize: "10px", color: "#667eea" }}>(you)</span>}
                    <button type="button" onClick={() => removeSharedUser(u._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "15px", padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <button type="submit" style={{ padding: "9px 24px", background: "#667eea", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
          Add Task
        </button>
      </form>
    </div>
  );
};

export default AddTodo;
