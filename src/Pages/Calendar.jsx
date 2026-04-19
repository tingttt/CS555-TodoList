import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function parseTaskDate(due) {
  if (!due) return null;
  const parts = due.split("/");
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map(Number);
  if (!m || !d || !y) return null;
  return new Date(y, m - 1, d);
}

function toKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function Calendar() {
  const { API } = useAuth();
  const [todos, setTodos] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(null); // Date object or null

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/tasks`),
      axios.get(`${API}/api/tasks/shared-with-me`),
    ]).then(([myRes, sharedRes]) => {
      setTodos(myRes.data);
      setSharedWithMe(sharedRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [API]);

  const allTasks = [...todos, ...sharedWithMe.map((t) => ({ ...t, _sharedWithMe: true }))];

  // Build a map: "YYYY-M-D" -> [tasks]
  const taskMap = {};
  allTasks.forEach((task) => {
    const d = parseTaskDate(task.due);
    if (!d) return;
    const key = toKey(d);
    if (!taskMap[key]) taskMap[key] = [];
    taskMap[key].push(task);
  });

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay  = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun

  const cells = [];
  // Leading blanks
  for (let i = 0; i < startOffset; i++) cells.push(null);
  // Days
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(viewYear, viewMonth, d));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  };
  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(today);
  };

  const isToday = (d) => d && toKey(d) === toKey(today);
  const isSelected = (d) => d && selectedDay && toKey(d) === toKey(selectedDay);

  const selectedTasks = selectedDay ? (taskMap[toKey(selectedDay)] || []) : [];

  // Upcoming tasks (next 7 days from today, sorted)
  const upcoming = allTasks
    .filter((t) => {
      const d = parseTaskDate(t.due);
      if (!d || t.completed) return false;
      const diff = (d - today) / 86400000;
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => parseTaskDate(a.due) - parseTaskDate(b.due));

  if (loading) return <div style={{ padding: "32px", textAlign: "center" }}>Loading…</div>;

  return (
    <div className="calendar-page">
      {/* ── Header ── */}
      <div className="cal-header">
        <h1 className="page-title" style={{ margin: 0 }}>Calendar</h1>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
          <span className="cal-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>›</button>
          <button className="cal-today-btn" onClick={goToday}>Today</button>
        </div>
      </div>

      <div className="cal-layout">
        {/* ── Main calendar grid ── */}
        <div className="cal-grid-wrap">
          {/* Day name row */}
          <div className="cal-day-names">
            {DAY_NAMES.map((n) => <div key={n} className="cal-day-name">{n}</div>)}
          </div>

          {/* Cells */}
          <div className="cal-grid">
            {cells.map((date, idx) => {
              if (!date) return <div key={`blank-${idx}`} className="cal-cell cal-cell--blank" />;
              const key = toKey(date);
              const tasks = taskMap[key] || [];
              const hasTasks = tasks.length > 0;
              const todayCell = isToday(date);
              const selectedCell = isSelected(date);
              const hasOverdue = tasks.some((t) => !t.completed && parseTaskDate(t.due) < today);

              return (
                <div
                  key={key}
                  className={[
                    "cal-cell",
                    todayCell    ? "cal-cell--today"    : "",
                    selectedCell ? "cal-cell--selected" : "",
                    hasTasks     ? "cal-cell--has-tasks" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => setSelectedDay(date)}
                >
                  <span className="cal-date-num">{date.getDate()}</span>
                  {hasTasks && (
                    <div className="cal-dots">
                      {tasks.slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          className="cal-dot"
                          style={{ background: t.completed ? "#94a3b8" : PRIORITY_COLOR[t.priority] || "#94a3b8" }}
                        />
                      ))}
                      {tasks.length > 3 && <span className="cal-dot-more">+{tasks.length - 3}</span>}
                    </div>
                  )}
                  {hasOverdue && !todayCell && <span className="cal-overdue-flag">!</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="cal-sidebar">
          {/* Selected day detail */}
          <div className="cal-detail-panel">
            <h3 className="cal-detail-title">
              {selectedDay
                ? selectedDay.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                : "Select a day"}
            </h3>

            {selectedDay && selectedTasks.length === 0 && (
              <p className="cal-no-tasks">No tasks due this day.</p>
            )}

            {selectedTasks.map((task) => (
              <div key={task._id} className={`cal-task-item${task.completed ? " cal-task-item--done" : ""}`}>
                <div className="cal-task-priority" style={{ background: PRIORITY_COLOR[task.priority] || "#94a3b8" }} />
                <div className="cal-task-body">
                  <p className="cal-task-title" style={{ textDecoration: task.completed ? "line-through" : "none" }}>
                    {task.title}
                  </p>
                  <div className="cal-task-meta">
                    {task._sharedWithMe && <span className="badge badge-shared" style={{ fontSize: "0.7rem", padding: "2px 7px" }}>Shared</span>}
                    {task.priority && <span className={`badge badge-${task.priority}`} style={{ fontSize: "0.7rem", padding: "2px 7px" }}>{task.priority}</span>}
                    {task.category && <span className="badge badge-category" style={{ fontSize: "0.7rem", padding: "2px 7px" }}>{task.category}</span>}
                    {task.completed && <span className="badge badge-done" style={{ fontSize: "0.7rem", padding: "2px 7px" }}>✓ Done</span>}
                  </div>
                  {task.description && <p className="cal-task-desc">{task.description}</p>}
                  {task.assignedTo?.name && <p className="cal-task-assigned">👤 {task.assignedTo.name}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming tasks */}
          <div className="cal-upcoming-panel">
            <h3 className="cal-detail-title">Next 7 Days</h3>
            {upcoming.length === 0 && <p className="cal-no-tasks">Nothing due in the next 7 days.</p>}
            {upcoming.map((task) => {
              const d = parseTaskDate(task.due);
              return (
                <div
                  key={task._id}
                  className="cal-upcoming-item"
                  onClick={() => {
                    setSelectedDay(d);
                    setViewYear(d.getFullYear());
                    setViewMonth(d.getMonth());
                  }}
                >
                  <div className="cal-upcoming-date">
                    <span className="cal-upcoming-day">{d.getDate()}</span>
                    <span className="cal-upcoming-mon">{MONTH_NAMES[d.getMonth()].slice(0,3)}</span>
                  </div>
                  <div className="cal-task-body">
                    <p className="cal-task-title">{task.title}</p>
                    <div className="cal-task-meta">
                      <span className={`badge badge-${task.priority}`} style={{ fontSize: "0.7rem", padding: "2px 7px" }}>{task.priority}</span>
                      {task._sharedWithMe && <span className="badge badge-shared" style={{ fontSize: "0.7rem", padding: "2px 7px" }}>Shared</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
