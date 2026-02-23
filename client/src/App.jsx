/**
 * StyleAi - Main App Component
 *
 * This component includes a connection test that calls the backend
 * to verify the frontend and backend are communicating correctly.
 */

import { useState, useEffect } from 'react';

// Base URL for API calls - in development, Vite proxies /api to the backend
const API_BASE = '/api';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Call the backend health endpoint to verify the connection
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setHealth(null);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: 600 }}>
      <h1>StyleAi</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Wardrobe app – full-stack connection test
      </p>

      {error && (
        <div
          style={{
            padding: '1rem',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: 8,
            marginBottom: '1rem',
          }}
        >
          <strong>Connection error:</strong> {error}
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Make sure the backend is running: <code>cd server && npm run dev</code>
          </p>
        </div>
      )}

      {health && (
        <div
          style={{
            padding: '1rem',
            background: '#efe',
            border: '1px solid #cfc',
            borderRadius: 8,
          }}
        >
          <strong>Backend connected</strong>
          <pre style={{ marginTop: '0.5rem', fontSize: '0.85rem', overflow: 'auto' }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
