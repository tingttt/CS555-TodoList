// src/components/AddTodo.jsx
import React, { useState } from "react";
import validation from "../utils/validation";

const AddTodo = ({ addTodo }) => {
    const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // yyyy-mm-dd
  };
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState(getToday());
  const [priority, setPriority] = useState("low");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [assignedTo, setAssignedTo] = useState("");


  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); // Clear previous
    const convertDateFormat = (dateString) => {
      // Convert yyyy-mm-dd to mm/dd/yyyy
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

      if (dueDate < today) {
        throw new Error("Due date must be today or in the future.");
      }

      // Create todo object
      const newTodo = {
        title: validatedTitle,
        description: validatedDescription,
        due: validatedDate,
        priority: priority,
        category: category,
        assignedTo: assignedTo, 
        completed: false,
      };
      
      console.log("newTodo:", newTodo);
      addTodo(newTodo);

      // Reset form input after successful submission and ad new todo
      setTitle("");
      setDescription("");
      setDue(getToday());
      setPriority("low");
      setCategory("");
      setError("");
      setAssignedTo("");
    } catch (err) {
      setError(err.message);
    }

    
  };

  return (
    <div>
      <h2>Add New Todo</h2>
      {error ? <p style={{ color: "red" }}>{error}</p> : null}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title: </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Description: </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Due Date: </label>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            min={getToday()}
            required
          />
        </div>
        <div>
          <label htmlFor="priority">Priority </label>
          <select id="priority" name="priority" value={priority}
            onChange={(e) => setPriority(e.target.value)}
            required
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>

          </select>
        </div>
        <div>
          <label htmlFor="category">Category </label>
          <select
            id="category" name="category"
            type="date"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select a Category</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="health">Health</option>
            <option value="finance">Finance</option>
            <option value="learn">Learning</option>
          </select>
        </div>

        <div>
          <label>Assign To: </label>
          <input
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Enter name..."
          />
        </div>

        <button type="submit">Add Todo</button>
      </form>
    </div>
  );
};

export default AddTodo;
