import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Configure axios to always send cookies (session cookie)
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { name, email } or null
  const [loading, setLoading] = useState(true); // true while checking session on mount

  // ── Check existing session when app loads ──────────────────────────────────
  useEffect(() => {
    axios
      .get(`${API}/api/auth/me`)
      .then((res) => {
        if (res.data.authenticated) {
          setUser({ name: res.data.name, userId: res.data.userId });
        }
      })
      .catch(() => {
        // Not authenticated — that's fine, just leave user as null
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Sign up ────────────────────────────────────────────────────────────────
  const signup = async (name, email, password) => {
    const res = await axios.post(`${API}/api/auth/signup`, { name, email, password });
    setUser(res.data.user);
    return res.data;
  };

  // ── Sign in ────────────────────────────────────────────────────────────────
  const signin = async (email, password) => {
    const res = await axios.post(`${API}/api/auth/signin`, { email, password });
    setUser(res.data.user);
    return res.data;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await axios.post(`${API}/api/auth/logout`);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, signin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
