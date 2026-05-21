import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', padding: 32, borderRadius: 12, width: 384, border: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: 'var(--accent)' }}>
          Jobentra CRM
        </h1>

        {error && (
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '8px 12px', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, marginBottom: 16, fontSize: 14, background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border)', outline: 'none' }}
          required
          autoFocus
        />

        <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, marginBottom: 24, fontSize: 14, background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border)', outline: 'none' }}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '10px', borderRadius: 6, fontSize: 14, fontWeight: 600,
            background: 'var(--accent)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
