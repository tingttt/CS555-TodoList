import { NavLink } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

function AppNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={NavLink} to="/">MyApp</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end>Home</Nav.Link>
            <Nav.Link as={NavLink} to="/task" end>Task</Nav.Link>
            <Nav.Link as={NavLink} to="/calendar" end>Calendar</Nav.Link>
            <Nav.Link as={NavLink} to="/settings">Settings</Nav.Link>
          </Nav>
          <Nav>
            <Button as={NavLink} to="/signin" variant="outline-light">Login/Signup</Button>
          </Nav>
          
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;