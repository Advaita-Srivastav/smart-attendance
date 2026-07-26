import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Onboarding() {
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim()) return setError('Roll number required');
    setLoading(true);
    try {
      const res = await API.post('/auth/update-profile', { roll_number: rollNumber });
      loginUser({ ...user, roll_number: rollNumber }, localStorage.getItem('token'));
      navigate('/student');
    } catch (err) {
      setError('Failed to save. Try again.');
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #667eea, #f093fb)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 16px'
          }}>🎓</div>
          <h2 style={{ margin: 0, color: '#2d2d2d' }}>Complete Your Profile</h2>
          <p style={{ margin: '8px 0 0', color: '#999', fontSize: '14px' }}>
            Enter your roll number to continue
          </p>
        </div>

        {error && (
          <div style={{
            background: '#ffebee', border: '1px solid #ffcdd2',
            borderRadius: '8px', padding: '12px',
            marginBottom: '20px', color: '#c62828',
            fontSize: '14px', textAlign: 'center'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', marginBottom: '6px',
              color: '#555', fontSize: '14px', fontWeight: '500'
            }}>Roll Number</label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 1BM22CS045"
              required
              style={{
                width: '100%', padding: '12px 14px',
                borderRadius: '10px', border: '1.5px solid #eee',
                fontSize: '14px', outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#eee'}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #f093fb)',
            color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Saving...' : 'Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}