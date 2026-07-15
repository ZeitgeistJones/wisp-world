'use client';
import { useState } from 'react';

export default function Admin() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function tick() {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/tick', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult('error: ' + (e instanceof Error ? e.message : 'unknown'));
    }
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 40, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18, fontWeight: 500 }}>driftlight admin</h1>
      <p style={{ fontSize: 13, color: '#888' }}>
        force the next story cycle without waiting for the daily cron.
      </p>
      <input
        type="password"
        placeholder="admin token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        style={{ padding: 8, fontSize: 14, width: 260, marginTop: 16, display: 'block' }}
      />
      <button
        onClick={tick}
        disabled={loading || !token}
        style={{ marginTop: 12, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}
      >
        {loading ? 'running...' : 'force next tick'}
      </button>
      <pre
        style={{
          marginTop: 20,
          background: '#f5f5f5',
          padding: 12,
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          borderRadius: 6,
        }}
      >
        {result}
      </pre>
    </main>
  );
}
