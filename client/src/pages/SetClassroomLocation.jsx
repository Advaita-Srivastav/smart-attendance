import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function SetClassroomLocation() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Tap the button when you are inside the classroom');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const subject_id = searchParams.get('subject_id');

  const setLocation = () => {
    setStatus('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await API.post('/attendance/classroom/set-location', {
            subject_id: parseInt(subject_id),
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            radius_meters: 50
          });
          setStatus(`✅ Classroom location set! Accuracy: ${Math.round(pos.coords.accuracy)} meters`);
          setDone(true);
        } catch (err) {
          setStatus('Failed to set location. Try again.');
        }
      },
      (err) => setStatus('Location access denied — enable GPS and try again'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, sans-serif',
      padding: '20px',
      textAlign: 'center',
      color: 'white'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        color: '#2d2d2d'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
        <h2 style={{ margin: '0 0 8px' }}>Set Classroom Location</h2>
        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 24px' }}>
          Stand inside your classroom and tap the button below
        </p>
        <p style={{
          background: '#f8f9ff',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '24px',
          color: '#555'
        }}>{status}</p>
        {!done ? (
          <button onClick={setLocation} style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #667eea, #f093fb)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            📍 Set My Location as Classroom
          </button>
        ) : (
          <button onClick={() => navigate('/teacher')} style={{
            width: '100%',
            padding: '14px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            ✅ Done — Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}