import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MarkAttendance() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Getting your location...');
  const [done, setDone] = useState(false);
  const device_id = navigator.userAgent + window.screen.width + window.screen.height;
  const session_id = searchParams.get('session_id');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (!session_id || !token) return setStatus('Invalid QR code');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setStatus('Marking attendance...');
          const res = await API.post('/attendance/mark', {
             session_id: parseInt(session_id),
             qr_token: token,
             latitude: pos.coords.latitude,
             longitude: pos.coords.longitude,
             device_id: btoa(device_id) // base64 encode it
            });
          setStatus(res.data.message);
          setDone(true);
        } catch (err) {
          setStatus(err.response?.data?.error || 'Failed to mark attendance');
        }
      },
      () => setStatus('Location access denied — enable location and try again')
    );
  }, [user, navigate, session_id, token, device_id]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h2>Smart Attendance</h2>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>{status}</p>
      {done && (
        <button
          onClick={() => navigate('/student')}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Go to Dashboard
        </button>
      )}
    </div>
  );
}