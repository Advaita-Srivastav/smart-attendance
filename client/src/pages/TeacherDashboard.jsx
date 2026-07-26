import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const colors = {
  purple: '#667eea',
  pink: '#f093fb',
  orange: '#f5a623',
  green: '#4CAF50',
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

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [session, setSession] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [message, setMessage] = useState('');
  const [settingLocation, setSettingLocation] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await API.get('/subjects');
      setSubjects(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchAttendees = useCallback(async (sessionId) => {
    try {
      const res = await API.get(`/attendance/session/${sessionId}`);
      setAttendees(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  useEffect(() => {
    if (!session) return;
    const qrInterval = setInterval(async () => {
      try {
        const res = await API.post('/attendance/session/refresh-qr', { session_id: session.id });
        setQrToken(res.data.token);
      } catch (err) { console.error(err); }
    }, 25000);
    const attendeeInterval = setInterval(() => fetchAttendees(session.id), 10000);
    return () => { clearInterval(qrInterval); clearInterval(attendeeInterval); };
  }, [session, fetchAttendees]);

  const createSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      await API.post('/subjects', { name: newSubject });
      setNewSubject('');
      fetchSubjects();
      setMessage('Subject created!');
    } catch (err) { console.error(err); }
  };

  const deleteSubject = async (id) => {
    try {
      await API.delete(`/subjects/${id}`);
      fetchSubjects();
      setMessage('Subject deleted');
    } catch (err) { setMessage('Failed to delete subject'); }
  };

  const setClassroomLocation = () => {
    if (!selectedSubject) return setMessage('Select a subject first');
    setSettingLocation(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await API.post('/attendance/classroom/set-location', {
          subject_id: selectedSubject,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          radius_meters: 50
        });
        setMessage('Classroom location set successfully!');
        setSettingLocation(false);
      } catch (err) {
        setMessage('Failed to set location');
        setSettingLocation(false);
      }
    }, () => {
      setMessage('Location access denied');
      setSettingLocation(false);
    });
  };

  const startSession = async () => {
    if (!selectedSubject) return setMessage('Select a subject first');
    try {
      const res = await API.post('/attendance/session/start', { subject_id: selectedSubject });
      setSession(res.data.session);
      setQrToken(res.data.qr.token);
      fetchAttendees(res.data.session.id);
      setMessage('');
    } catch (err) { setMessage('Failed to start session'); }
  };

  const endSession = async () => {
    try {
      await API.post('/attendance/session/end', { session_id: session.id });
      setSession(null);
      setQrToken('');
      setAttendees([]);
    } catch (err) { console.error(err); }
  };

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
          <h2 style={{ margin: 0 }}>👩‍🏫 Teacher Dashboard</h2>
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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
        {message && (
          <div style={{
            background: '#e8f5e9',
            border: '1px solid #4CAF50',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#2e7d32'
          }}>{message}</div>
        )}

        {/* Create Subject */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', color: colors.dark }}>📚 Subjects</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. Data Structures"
              style={{
                flex: 1, padding: '10px 14px',
                borderRadius: '8px', border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
            <button onClick={createSubject} style={{
              background: `linear-gradient(135deg, ${colors.purple}, ${colors.pink})`,
              color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold'
            }}>Add</button>
          </div>

          {/* Subject List with Delete */}
          {subjects.map(s => (
            <div key={s.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: '#f8f9ff',
              borderRadius: '8px',
              marginBottom: '8px',
              border: '1px solid #eee'
            }}>
              <span style={{ fontWeight: '500', color: colors.dark }}>{s.name}</span>
              <button onClick={() => deleteSubject(s.id)} style={{
                background: colors.red,
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>Delete</button>
            </div>
          ))}
        </div>

        {/* Session Control */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', color: colors.dark }}>🎯 Session Control</h3>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: '8px', border: '1px solid #ddd',
              fontSize: '14px', marginBottom: '12px'
            }}
          >
            <option value="">Select subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={setClassroomLocation} disabled={settingLocation} style={{
              background: `linear-gradient(135deg, ${colors.orange}, #f5a623cc)`,
              color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold'
            }}>
              {settingLocation ? 'Getting Location...' : '📍 Set My Location as Classroom'}
            </button>

            {!session ? (
              <button onClick={startSession} style={{
                background: `linear-gradient(135deg, ${colors.green}, #43a047)`,
                color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }}>▶ Start Session</button>
            ) : (
              <button onClick={endSession} style={{
                background: `linear-gradient(135deg, ${colors.red}, #d32f2f)`,
                color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }}>⏹ End Session</button>
            )}
          </div>
        </div>

        {/* Active Session */}
        {session && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* QR Code */}
            <div style={{ ...card, textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px', color: colors.dark }}>📲 Scan to Mark</h3>
              <p style={{ margin: '0 0 16px', color: '#666', fontSize: '13px' }}>
                Refreshes every 30 seconds
              </p>
              {qrToken && (
                <div style={{
                  display: 'inline-block',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
                }}>
                  <QRCodeSVG
                    value={`https://your-vercel-url.vercel.app/mark-attendance?session_id=${session.id}&token=${qrToken}`}
                    size={180}
                  />
                </div>
              )}
            </div>

            {/* Attendees */}
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', color: colors.dark }}>
                ✅ Present ({attendees.length})
              </h3>
              {attendees.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px' }}>Waiting for students...</p>
              ) : (
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {attendees.map(a => (
                    <div key={a.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      background: '#f0fff4',
                      border: '1px solid #c8e6c9'
                    }}>
                      <span style={{ fontWeight: 'bold', color: colors.dark }}>{a.name}</span>
                      <span style={{ color: '#666', fontSize: '13px' }}>
                        {new Date(a.marked_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}