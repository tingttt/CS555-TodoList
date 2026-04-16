import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page the user originally tried to visit, or /task
  const from = location.state?.from?.pathname || '/task';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signin(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center vh-100">
      <main className="w-100 m-auto" style={{ maxWidth: '330px' }}>
        <Form onSubmit={handleSubmit}>
          <h1 className="h3 mb-3 fw-normal text-center">Please sign in</h1>

          {error && <p style={{ color: 'red' }} className="text-center">{error}</p>}

          <Form.Group className="form-floating mb-3" controlId="floatingInput">
            <Form.Control
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Form.Label>Email address</Form.Label>
          </Form.Group>

          <Form.Group className="form-floating mb-3" controlId="floatingPassword">
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Form.Label>Password</Form.Label>
          </Form.Group>

          <Button
            variant="primary"
            className="w-100 py-2"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="text-center mt-3">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>

          <p className="mt-3 mb-3 text-body-secondary text-center">
            © 2026 ToDo App Team
          </p>
        </Form>
      </main>
    </Container>
  );
};

export default Signin;
