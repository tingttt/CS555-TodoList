import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Dropdown search for registered users. Calls onAdd(user) when a user is selected.
export default function MemberSearch({ onAdd, excludeIds = [] }) {
  const { API } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/users/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.filter((u) => !excludeIds.includes(u._id)));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  }, [query, excludeIds, API]);

  const handleSelect = (user) => {
    onAdd(user);
    setQuery('');
    setResults([]);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
      />
      {(results.length > 0 || loading) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
          {loading && <div style={{ padding: '10px', fontSize: '13px', color: '#999' }}>Searching…</div>}
          {results.map((u) => (
            <div
              key={u._id}
              onClick={() => handleSelect(u)}
              style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <strong>{u.name}</strong> <span style={{ color: '#888', fontSize: '12px' }}>{u.email}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
