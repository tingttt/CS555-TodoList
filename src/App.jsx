import { Routes, Route } from "react-router-dom";
import Calendar from "./Pages/Calendar";
import Home from "./Pages/Home";
import Tasks from "./Pages/Tasks";
import Settings from "./Pages/Settings";
import Nav from './components/Nav';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container } from 'react-bootstrap';
import Signin from "./Pages/Signin";
import Signup from "./Pages/Signup";
import { useState } from "react";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`d-flex flex-column vh-100 ${darkMode ? "dark-mode" : ""}`}>
      <Nav darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="flex-grow-1 overflow-auto">
        <Container className="py-4">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes — redirects to /signin if not authenticated */}
            <Route path="/task" element={
              <ProtectedRoute><Tasks /></ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute><Calendar /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings darkMode={darkMode} setDarkMode={setDarkMode} />
              </ProtectedRoute>
            } />
          </Routes>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
