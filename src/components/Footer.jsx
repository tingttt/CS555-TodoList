// src/components/Footer.jsx
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start">
            <h5>ToDo App</h5>
            <p className="small mb-0">© 2026 Your Team Name. All rights reserved.</p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <ul className="list-unstyled mb-0">
              <li><a href="/about" className="text-light text-decoration-none">About Us</a></li>
              <li><a href="/privacy" className="text-light text-decoration-none">Privacy Policy</a></li>
            </ul>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;