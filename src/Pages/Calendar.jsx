import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

function parseTaskDate(due) {
  if (!due) return null;
  const [m, d, y] = due.split("/").map(Number);
  if (!m || !d || !y) return null;
  return new Date(y, m - 1, d);
}

export default function CalendarPage() {
  const { API } = useAuth();
  const [todos, setTodos] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/tasks`),
      axios.get(`${API}/api/tasks/shared-with-me`),
    ]).then(([myRes, sharedRes]) => {
      setTodos(myRes.data);
      setSharedWithMe(sharedRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [API]);

  // Convert tasks to react-big-calendar events
  const events = [...todos, ...sharedWithMe.map((t) => ({ ...t, _sharedWithMe: true }))]
    .filter((t) => t.due)
    .map((task) => {
      const date = parseTaskDate(task.due);
      if (!date) return null;
      return {
        id: task._id,
        title: task.title,
        start: date,
        end: date,
        allDay: true,
        resource: task,
      };
    })
    .filter(Boolean);

  // Color each event by priority
  const eventPropGetter = (event) => {
    const task = event.resource;
    const bg = task.completed
      ? "#94a3b8"
      : PRIORITY_COLOR[task.priority] || "#6366f1";
    return {
      style: {
        backgroundColor: bg,
        border: "none",
        borderRadius: "6px",
        color: "#fff",
        fontSize: "0.78rem",
        fontWeight: 600,
        padding: "2px 6px",
        opacity: task.completed ? 0.6 : 1,
        textDecoration: task.completed ? "line-through" : "none",
        cursor: "default",
      },
    };
  };

  if (loading) return <div style={{ padding: "32px", textAlign: "center" }}>Loading…</div>;

  return (
    <div style={{ height: "calc(100vh - 160px)", minHeight: "600px" }}>
      <h1 className="page-title">Calendar</h1>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month", "week", "agenda"]}
        defaultView="month"
        eventPropGetter={eventPropGetter}
        onSelectEvent={() => {}} // read-only, no action on click
        style={{ height: "calc(100% - 60px)" }}
        popup
      />
    </div>
  );
}
