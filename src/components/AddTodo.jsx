import React, { useState } from "react";
import validation from "../utils/validation";

const getToday = () => new Date().toISOString().split("T")[0];

const convertDate = (dateString) => {
  const [year, month, day] = dateString.split("-");
  return `${month}/${day}/${year}`;
};

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
  } catch (e) {
    return e.message;
  }
};

const AddTodo = ({ addTodo }) => {
  const [fields, setFields] = useState({ title: "", description: "", due: getToday(), priority: "low", category: "", assignedTo: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = ["title", "description", "due", "category"];
    const newErrors = {};
    requiredFields.forEach((name) => { newErrors[name] = validateField(name, fields[name]); });
    setErrors(newErrors);
    setTouched({ title: true, description: true, due: true, category: true });

    if (requiredFields.some((name) => newErrors[name])) return;

    addTodo({
      title: fields.title.trim(),
      description: fields.description.trim(),
      due: convertDate(fields.due),
      priority: fields.priority,
      category: fields.category,
      assignedTo: fields.assignedTo,
      completed: false,
    });

    setFields({ title: "", description: "", due: getToday(), priority: "low", category: "", assignedTo: "" });
    setErrors({});
    setTouched({});
  };

  const f = (name) => ({
    name,
    value: fields[name],
    onChange: handleChange,
    onBlur: handleBlur,
    className: touched[name] && errors[name] ? "input-error" : "",
  });

  return (
    <div className="add-todo-card">
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit} noValidate>

        <div className="form-group">
          <label>Title</label>
          <input type="text" {...f("title")} placeholder="Task title..." />
          <div className="field-footer">
            {touched.title && errors.title
              ? <span className="field-error">{errors.title}</span>
              : <span className="field-hint">{fields.title.trim().length}/5 min characters</span>
            }
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea {...f("description")} placeholder="What needs to be done?" />
          <div className="field-footer">
            {touched.description && errors.description
              ? <span className="field-error">{errors.description}</span>
              : <span className="field-hint">{fields.description.trim().length}/25 min characters</span>
            }
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" {...f("due")} min={getToday()} />
            {touched.due && errors.due && <span className="field-error">{errors.due}</span>}
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select name="priority" value={fields.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select {...f("category")}>
              <option value="">Select a category</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="learn">Learning</option>
            </select>
            {touched.category && errors.category && <span className="field-error">{errors.category}</span>}
          </div>
          <div className="form-group">
            <label>Assign To</label>
            <input type="text" name="assignedTo" value={fields.assignedTo} onChange={handleChange} placeholder="Enter name..." />
          </div>
        </div>

        <button type="submit" className="btn-submit">Add Task</button>
      </form>
    </div>
  );
};

export default AddTodo;
