import { useState } from "react";
import { Form, Button, Container, Alert } from "react-bootstrap";

export default function Settings( {darkMode, setDarkMode }) {
  const [profile, setProfile] = useState({
    name: localStorage.getItem("profileName") || "",
    email: localStorage.getItem("profileEmail") || "",
  });
  const [form, setForm] = useState({ name: profile.name, email: profile.email, oldPassword: "", newPassword: "", confirmPassword: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.newPassword) {
      const savedPassword = localStorage.getItem("profilePassword");
      if (savedPassword && form.oldPassword !== savedPassword) {
        setError("Current password is incorrect.");
        return;
      }
      if (form.newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
      localStorage.setItem("profilePassword", form.newPassword);
    }

    localStorage.setItem("profileName", form.name);
    localStorage.setItem("profileEmail", form.email);
    setProfile({ name: form.name, email: form.email });
    setForm((f) => ({ ...f, oldPassword: "", newPassword: "", confirmPassword: "" }));
    setSuccess("Profile updated successfully.");
  };

  return (
    <Container style={{ maxWidth: "480px", paddingTop: "32px" }}>
      <h2 className="mb-4">User Profile</h2>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="profileName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="profileEmail">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
          />
        </Form.Group>

        <hr />
        <p className="text-muted" style={{ fontSize: "13px" }}>Leave password fields blank to keep your current password.</p>

        {localStorage.getItem("profilePassword") && (
          <Form.Group className="mb-3" controlId="oldPassword">
            <Form.Label>Current Password</Form.Label>
            <Form.Control
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              placeholder="Enter current password"
            />
          </Form.Group>
        )}

        <Form.Group className="mb-3" controlId="newPassword">
          <Form.Label>New Password</Form.Label>
          <Form.Control
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="At least 6 characters"
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="confirmPassword">
          <Form.Label>Confirm New Password</Form.Label>
          <Form.Control
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat new password"
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100">
          Save Changes
        </Button>
      </Form>

      <hr className="my-4" />
      <h4 className="mb-3">App Preferences</h4>

      <Form.Group className="mb-3 d-flex justify-content-between align-items-center">
        <Form.Label className="mb-0">Dark Mode</Form.Label>
        <Form.Check
          type="switch"
          id="darkModeSwitch"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Reminder Window (days before due date)</Form.Label>
        <Form.Select
          defaultValue={localStorage.getItem("reminderDays") || "3"}
          onChange={(e) => localStorage.setItem("reminderDays", e.target.value)}
        >
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="5">5 days</option>
          <option value="7">7 days</option>
        </Form.Select>
        <Form.Text className="text-muted">
          You'll see reminders for tasks due within this window.
        </Form.Text>
      </Form.Group>
      
    </Container>
  );
}
