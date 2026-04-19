import { Routes, Route } from "react-router-dom";
import Calendar from "./Pages/Calendar";
import Home from "./Pages/Home";
import Tasks from "./Pages/Tasks";
import Settings from "./Pages/Settings";
import InviteAccept from "./Pages/InviteAccept";
import Nav from './components/Nav';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container } from 'react-bootstrap';
import Signin from "./Pages/Signin";
import Signup from "./Pages/Signup";
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  // Sync darkMode from user profile when user loads
  useEffect(() => {
    if (user?.darkMode !== undefined) {
      setDarkMode(user.darkMode);
    }
  }, [user?.darkMode]);

  return (
    <div className={`d-flex flex-column vh-100 ${darkMode ? "dark-mode" : ""}`}>
      <Nav darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="flex-grow-1 overflow-auto">
        <Container className="py-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/task" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/shared/:taskId" element={<ProtectedRoute><InviteAccept /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings darkMode={darkMode} setDarkMode={setDarkMode} /></ProtectedRoute>} />
          </Routes>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
