import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  try {
    const res = await login({ email, password });
    loginUser(res.data.user, res.data.token);
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect) navigate(redirect);
    else if (res.data.user.role === 'student') navigate('/student');
    else navigate('/teacher');
  } catch (err) {
    setError('Invalid email or password');
  }
  setLoading(false);
};

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #667eea, #f093fb)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 16px'
          }}>📍</div>
          <h2 style={{ margin: 0, color: '#2d2d2d', fontSize: '24px' }}>Smart Attendance</h2>
          <p style={{ margin: '8px 0 0', color: '#999', fontSize: '14px' }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#c62828',
            fontSize: '14px',
            textAlign: 'center'
          }}>{error}</div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #eee',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#eee'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #eee',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#eee'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #f093fb)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#999', fontSize: '13px' }}>
          Contact your teacher or admin to get your account
        </p>
      </div>
    </div>
  );
}