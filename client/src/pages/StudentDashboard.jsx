import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const socket = io('https://smart-attendance-6xzx.onrender.com');
const colors = {
  purple: '#667eea',
  pink: '#f093fb',
  green: '#4CAF50',
  orange: '#f5a623',
  red: '#ff5252',
  dark: '#2d2d2d',
  light: '#f8f9ff'
};

const card = {
  background: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  marginBottom: '20px'
};

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [message, setMessage] = useState('');
  const [recheckPending, setRecheckPending] = useState(null);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await API.get('/attendance/my-attendance');
      setAttendanceRecords(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    socket.emit('register_student', user.id);
    fetchAttendance();
    socket.on('recheck_request', ({ attendanceId }) => {
      setRecheckPending(attendanceId);
    });
    return () => socket.off('recheck_request');
  }, [user.id, fetchAttendance]);

  const respondToRecheck = (passed) => {
    socket.emit('recheck_response', { attendanceId: recheckPending, passed });
    setRecheckPending(null);
    setMessage(passed ? '✅ Recheck confirmed!' : '❌ Recheck failed — marked absent');
  };

  const groupBySubject = () => {
    const grouped = {};
    attendanceRecords.forEach(r => {
      if (!grouped[r.subject_name]) grouped[r.subject_name] = { present: 0, total: 0 };
      grouped[r.subject_name].total++;
      if (r.status === 'present') grouped[r.subject_name].present++;
    });
    return grouped;
  };

  const grouped = groupBySubject();
  const subjectColors = ['#667eea', '#f093fb', '#f5a623', '#4CAF50', '#ff5252', '#00bcd4'];

  return (
    <div style={{ minHeight: '100vh', background: colors.light, fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.purple}, ${colors.pink})`,
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>🎓 Student Dashboard</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>Welcome, {user.name}</p>
        </div>
        <button onClick={logout} style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid white',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>Logout</button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Recheck Alert */}
        {recheckPending && (
          <div style={{
            background: 'linear-gradient(135deg, #f5a623, #f093fb)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px' }}>⚠️ Location Recheck</h3>
            <p style={{ margin: '0 0 16px' }}>Are you still in class?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => respondToRecheck(true)} style={{
                background: 'white', color: colors.green,
                border: 'none', padding: '10px 24px',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}>✅ Yes, I'm here</button>
              <button onClick={() => respondToRecheck(false)} style={{
                background: 'rgba(255,255,255,0.2)', color: 'white',
                border: '1px solid white', padding: '10px 24px',
                borderRadius: '8px', cursor: 'pointer'
              }}>No</button>
            </div>
          </div>
        )}

        {message && (
          <div style={{
            background: message.includes('✅') ? '#e8f5e9' : '#ffebee',
            border: `1px solid ${message.includes('✅') ? '#4CAF50' : '#ff5252'}`,
            borderRadius: '8px', padding: '12px 16px',
            marginBottom: '20px',
            color: message.includes('✅') ? '#2e7d32' : '#c62828'
          }}>{message}</div>
        )}

        {/* Attendance Summary */}
        <div style={card}>
          <h3 style={{ margin: '0 0 20px', color: colors.dark }}>📊 My Attendance</h3>
          {Object.keys(grouped).length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No attendance records yet. Scan a QR code in class to get started!
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {Object.entries(grouped).map(([subject, data], i) => {
                const pct = Math.round((data.present / data.total) * 100);
                const color = subjectColors[i % subjectColors.length];
                return (
                  <div key={subject} style={{
                    borderRadius: '12px',
                    padding: '16px',
                    background: `${color}15`,
                    border: `2px solid ${color}30`
                  }}>
                    <div style={{ fontWeight: 'bold', color: colors.dark, marginBottom: '8px' }}>
                      {subject}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>
                      {pct}%
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                      {data.present}/{data.total} classes
                    </div>
                    <div style={{
                      marginTop: '10px',
                      height: '6px',
                      background: '#eee',
                      borderRadius: '3px'
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Records */}
        {attendanceRecords.length > 0 && (
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: colors.dark }}>📋 Recent History</h3>
            {attendanceRecords.slice(0, 10).map(r => (
              <div key={r.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '8px',
                background: r.status === 'present' ? '#f0fff4' : '#fff5f5',
                border: `1px solid ${r.status === 'present' ? '#c8e6c9' : '#ffcdd2'}`
              }}>
                <span style={{ fontWeight: 'bold', color: colors.dark }}>{r.subject_name}</span>
                <span style={{ fontSize: '13px', color: '#666' }}>
                  {new Date(r.marked_at).toLocaleDateString()}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: r.status === 'present' ? colors.green : colors.red,
                  color: 'white'
                }}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}