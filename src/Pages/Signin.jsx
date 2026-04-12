import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const savedEmail = localStorage.getItem('profileEmail');
    const savedPassword = localStorage.getItem('profilePassword');

    if (email !== savedEmail || password !== savedPassword) {
      setError('Invalid email or password.');
      return;
    }

    localStorage.setItem('isLoggedIn', 'true');
    if (remember) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    navigate('/task');
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

          <Form.Check
            className="text-start my-3"
            type="checkbox"
            id="remember-me"
            label="Remember me"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />

          <Button variant="primary" className="w-100 py-2" type="submit">
            Sign in
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