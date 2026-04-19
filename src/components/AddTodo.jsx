import React, { useState } from "react";
import validation from "../utils/validation";

const AddTodo = ({ addTodo }) => {
  const getToday = () => new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState(getToday());
  const [priority, setPriority] = useState("low");
  const [category, setCategory] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [m, d, y] = validatedDate.split("/").map(Number);
      const dueDate = new Date(y, m - 1, d);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) throw new Error("Due date must be today or in the future.");

      addTodo({ title: validatedTitle, description: validatedDescription, due: validatedDate, priority, category, assignedTo, completed: false });

      setTitle(""); setDescription(""); setDue(getToday());
      setPriority("low"); setCategory(""); setAssignedTo(""); setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="add-todo-card">
      <h2>Add New Task</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done?" required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} min={getToday()} required />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select a category</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="learn">Learning</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assign To</label>
            <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Enter name..." />
          </div>
        </div>
        <button type="submit" className="btn-submit">Add Task</button>
      </form>
    </div>
  );
};

export default AddTodo;
