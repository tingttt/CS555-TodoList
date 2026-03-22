import React from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Signin = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <Container className="d-flex align-items-center justify-content-center vh-100">
      <main className="w-100 m-auto" style={{ maxWidth: '330px' }}>
        <Form onSubmit={handleSubmit}>
          
          <h1 className="h3 mb-3 fw-normal text-center">Please sign in</h1>

          <Form.Group className="form-floating mb-3" controlId="floatingInput">
            <Form.Control type="email" placeholder="name@example.com" />
            <Form.Label>Email address</Form.Label>
          </Form.Group>

          <Form.Group className="form-floating mb-3" controlId="floatingPassword">
            <Form.Control type="password" placeholder="Password" />
            <Form.Label>Password</Form.Label>
          </Form.Group>

          <Form.Check 
            className="text-start my-3" 
            type="checkbox" 
            id="remember-me" 
            label="Remember me" 
          />

          <Button variant="primary" className="w-100 py-2" type="submit">
            Sign in
          </Button>

          {/* Don't have an account line */}
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