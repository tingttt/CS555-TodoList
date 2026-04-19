import { NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

function AppNavbar({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={NavLink} to="/">MyApp</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end>Home</Nav.Link>
            <Nav.Link as={NavLink} to="/task" end>My Tasks</Nav.Link>
            <Nav.Link as={NavLink} to="/calendar" end>Calendar</Nav.Link>
            <Nav.Link as={NavLink} to="/settings">Settings</Nav.Link>
          </Nav>
          <Nav className="align-items-center gap-2">
            <Button variant={darkMode ? 'light' : 'outline-light'} onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀ Light Mode' : '🌙 Dark Mode'}
            </Button>
            {user ? (
              <>
                <span className="text-light" style={{ fontSize: '14px' }}>Hi, {user.name}</span>
                <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <Button as={NavLink} to="/signin" variant="outline-light">Login / Sign Up</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
