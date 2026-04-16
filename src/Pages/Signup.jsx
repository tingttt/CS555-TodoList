import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/task', { replace: true }); // auto-login after signup
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center vh-100">
      <main className="w-100 m-auto" style={{ maxWidth: '330px' }}>
        <Form onSubmit={handleSubmit}>

          <h1 className="h3 mb-3 fw-normal text-center">Create Account</h1>

          {error && <p style={{ color: 'red' }} className="text-center">{error}</p>}

          <Form.Group className="form-floating mb-3" controlId="floatingName">
            <Form.Control
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Form.Label>Full Name</Form.Label>
          </Form.Group>

          <Form.Group className="form-floating mb-3" controlId="floatingEmail">
            <Form.Control
              type="email"
              name="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Form.Label>Email address</Form.Label>
          </Form.Group>

          <Form.Group className="form-floating mb-3" controlId="floatingPassword">
            <Form.Control
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <Form.Label>Password</Form.Label>
          </Form.Group>

          <Form.Group className="form-floating mb-3" controlId="floatingConfirm">
            <Form.Control
              type="password"
              name="confirm"
              placeholder="Confirm Password"
              value={form.confirm}
              onChange={handleChange}
              required
            />
            <Form.Label>Confirm Password</Form.Label>
          </Form.Group>

          <Button variant="primary" className="w-100 py-2" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </Button>

          <p className="text-center mt-3">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>

          <p className="mt-3 mb-3 text-body-secondary text-center">
            © 2026 ToDo App Team
          </p>

        </Form>
      </main>
    </Container>
  );
};

export default Signup;
