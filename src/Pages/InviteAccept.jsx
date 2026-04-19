import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function InviteAccept() {
  const { taskId } = useParams();
  const { user, loading, API } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Joining task…');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/signin', { state: { from: { pathname: `/shared/${taskId}` } }, replace: true });
      return;
    }
    axios.get(`${API}/api/tasks/join/${taskId}`)
      .then(() => {
        setStatus('Joined! Redirecting to My Tasks…');
        setTimeout(() => navigate('/task', { replace: true }), 800);
      })
      .catch((err) => {
        setStatus(err.response?.data?.message || 'Task not found or no longer shared.');
      });
  }, [user, loading, taskId, API, navigate]);

  return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#555' }}>
      <p style={{ fontSize: '18px' }}>{status}</p>
    </div>
  );
}
