// ========== 1️⃣ Initialize ==========
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  renderTasks();
  // Add task on Enter key
  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });
});

// ========== 2️⃣ Add Task ==========
function addTask() {
  const taskText = taskInput.value.trim();

  // Validate input is not empty
  if (!taskText) {
    alert("Please enter task content");
    return;
  }

  // Create task object
  const task = {
    id: Date.now(), // Use timestamp as unique ID
    text: taskText,
    completed: false,
    createdAt: new Date().toLocaleString("en-US"),
  };

  // Add to task array
  tasks.push(task);

  // Save to localStorage
  saveTasks();

  // Clear input field
  taskInput.value = "";
  taskInput.focus();

  // Re-render page
  renderTasks();
}

// ========== 3️⃣ Display Task List ==========
function renderTasks() {
  // Clear list
  taskList.innerHTML = "";

  // If no tasks, show empty state
  if (tasks.length === 0) {
    emptyState.style.display = "block";
    updateStats();
    return;
  }

  emptyState.style.display = "none";

  // Iterate through tasks and create DOM elements
  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.id = `task-${task.id}`;

    li.innerHTML = `
            <input 
                type="checkbox" 
                class="checkbox" 
                ${task.completed ? "checked" : ""}
                onchange="toggleTask(${task.id})"
            >
            <span class="task-text" id="text-${task.id}">${escapeHtml(task.text)}</span>
            <button class="btn-edit" onclick="editTask(${task.id})">Edit</button>
            <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
        `;

    taskList.appendChild(li);
  });

  updateStats();
}

// ========== 4️⃣ Toggle Complete/Incomplete ==========
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

// ========== 5️⃣ Edit Task ==========
function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const taskElement = document.getElementById(`task-${id}`);
  const textElement = document.getElementById(`text-${id}`);

  // Create edit input field
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "edit-input";
  editInput.value = task.text;
  editInput.id = `edit-input-${id}`;

  // Create save and cancel buttons
  const btnContainer = document.createElement("div");
  btnContainer.style.display = "flex";
  btnContainer.style.gap = "5px";

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn-save";
  saveBtn.textContent = "Save";
  saveBtn.onclick = () => saveEdit(id, editInput.value);

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn-cancel";
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = () => cancelEdit(id);

  btnContainer.appendChild(saveBtn);
  btnContainer.appendChild(cancelBtn);

  // Replace content
  textElement.replaceWith(editInput);
  taskElement
    .querySelectorAll(".btn-edit, .btn-delete")
    .forEach((btn) => (btn.style.display = "none"));
  taskElement.appendChild(btnContainer);

  // Auto-focus input field
  editInput.focus();
  editInput.select();

  // Enter to save, ESC to cancel
  editInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveEdit(id, editInput.value);
    }
  });
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cancelEdit(id);
    }
  });
}

// Save edit
function saveEdit(id, newText) {
  const trimmedText = newText.trim();

  if (!trimmedText) {
    alert("Task content cannot be empty");
    return;
  }

  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.text = trimmedText;
    saveTasks();
    renderTasks();
  }
}

// Cancel edit
function cancelEdit(id) {
  renderTasks();
}

// ========== 6️⃣ Delete Task ==========
function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
  }
}

// ========== 7️⃣ Local Storage ==========
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ========== 8️⃣ Update Statistics ==========
function updateStats() {
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;

  document.getElementById("totalCount").textContent = totalCount;
  document.getElementById("completedCount").textContent = completedCount;
  document.getElementById("pendingCount").textContent = pendingCount;
}

// ========== 9️⃣ Safe HTML Escape ==========
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
