import { useState, useEffect } from "react";
import { Form, Button, Container, Alert } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Settings({ darkMode, setDarkMode }) {
  const { user, updateUser, API } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [myNameInput, setMyNameInput] = useState(user?.myName || "");
  const [reminderDays, setReminderDays] = useState(String(user?.reminderDays || 3));
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync form if user loads asynchronously
  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.name || "", email: user.email || "" }));
      setMyNameInput(user.myName || "");
      setReminderDays(String(user.reminderDays || 3));
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!form.name.trim()) { setError("Full name is required."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email)) { setError("Please enter a valid email address."); return; }

    if (form.newPassword) {
      if (form.newPassword.length < 6) { setError("New password must be at least 6 characters."); return; }
      if (form.newPassword !== form.confirmPassword) { setError("New passwords do not match."); return; }
    }

    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.newPassword) {
        payload.oldPassword = form.oldPassword;
        payload.newPassword = form.newPassword;
      }
      const res = await axios.patch(`${API}/api/profile`, payload);
      updateUser(res.data.user);
      setForm((f) => ({ ...f, oldPassword: "", newPassword: "", confirmPassword: "" }));
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMyName = async () => {
    try {
      await axios.patch(`${API}/api/profile`, { myName: myNameInput.trim() });
      updateUser({ myName: myNameInput.trim() });
      setSuccess("Display name saved.");
    } catch (err) {
      setError("Failed to save display name.");
    }
  };

  const handleDarkModeToggle = async () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    try {
      await axios.patch(`${API}/api/profile`, { darkMode: newVal });
      updateUser({ darkMode: newVal });
    } catch (err) {
      console.error("Failed to save dark mode preference.");
    }
  };

  const handleReminderChange = async (val) => {
    setReminderDays(val);
    try {
      await axios.patch(`${API}/api/profile`, { reminderDays: Number(val) });
      updateUser({ reminderDays: Number(val) });
    } catch (err) {
      console.error("Failed to save reminder preference.");
    }
  };

  return (
    <Container style={{ maxWidth: "480px", paddingTop: "32px" }}>
      <h2 className="mb-4">User Profile</h2>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="profileName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="profileEmail">
          <Form.Label>Email Address</Form.Label>
          <Form.Control type="email" name="email" value={form.email} onChange={handleChange} placeholder="name@example.com" required />
        </Form.Group>

        <hr />
        <p className="text-muted" style={{ fontSize: "13px" }}>Leave password fields blank to keep your current password.</p>

        <Form.Group className="mb-3" controlId="oldPassword">
          <Form.Label>Current Password</Form.Label>
          <Form.Control type="password" name="oldPassword" value={form.oldPassword} onChange={handleChange} placeholder="Required only if changing password" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="newPassword">
          <Form.Label>New Password</Form.Label>
          <Form.Control type="password" name="newPassword" value={form.newPassword} onChange={handleChange} placeholder="At least 6 characters" />
        </Form.Group>

        <Form.Group className="mb-4" controlId="confirmPassword">
          <Form.Label>Confirm New Password</Form.Label>
          <Form.Control type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat new password" />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </Form>

      <hr className="my-4" />
      <h4 className="mb-3">Task Preferences</h4>

      {/* My Name for task assignment filter */}
      <Form.Group className="mb-3">
        <Form.Label>Your Display Name <small className="text-muted">(used to filter "My Tasks")</small></Form.Label>
        <div style={{ display: "flex", gap: "8px" }}>
          <Form.Control
            type="text"
            value={myNameInput}
            onChange={(e) => setMyNameInput(e.target.value)}
            placeholder="Enter your name"
          />
          <Button variant="outline-primary" onClick={handleSaveMyName}>Save</Button>
        </div>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Reminder Window (days before due date)</Form.Label>
        <Form.Select value={reminderDays} onChange={(e) => handleReminderChange(e.target.value)}>
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="5">5 days</option>
          <option value="7">7 days</option>
        </Form.Select>
        <Form.Text className="text-muted">You'll see reminders for tasks due within this window.</Form.Text>
      </Form.Group>

      <hr className="my-4" />
      <h4 className="mb-3">App Preferences</h4>

      <Form.Group className="mb-3 d-flex justify-content-between align-items-center">
        <Form.Label className="mb-0">Dark Mode</Form.Label>
        <Form.Check type="switch" id="darkModeSwitch" checked={darkMode} onChange={handleDarkModeToggle} />
      </Form.Group>
    </Container>
  );
}
