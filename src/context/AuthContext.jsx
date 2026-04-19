import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { name, email, reminderDays, myName, darkMode, sortBy, userId }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/api/auth/me`)
      .then((res) => {
        if (res.data.authenticated) {
          // res.data has: { authenticated, userId, name, email, ... }
          setUser({ ...res.data });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const signup = async (name, email, password) => {
    const res = await axios.post(`${API}/api/auth/signup`, { name, email, password });
    setUser({ ...res.data.user });
    return res.data;
  };

  const signin = async (email, password) => {
    const res = await axios.post(`${API}/api/auth/signin`, { email, password });
    setUser({ ...res.data.user });
    return res.data;
  };

  const logout = async () => {
    await axios.post(`${API}/api/auth/logout`);
    setUser(null);
  };

  // Update user profile in the context after a profile save
  const updateUser = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, signin, logout, updateUser, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
