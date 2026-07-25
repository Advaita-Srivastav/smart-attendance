const pool = require('../config/db');
const { isWithinGeofence } = require('../utils/geofence');
const { generateQRToken, validateQRToken } = require('../services/qrService');

// Teacher: start a session
const startSession = async (req, res) => {
  const { subject_id } = req.body;
  const teacher_id = req.user.id;
  try {
    const result = await pool.query(
      'INSERT INTO sessions (subject_id, teacher_id) VALUES ($1, $2) RETURNING *',
      [subject_id, teacher_id]
    );
    const session = result.rows[0];
    const qr = await generateQRToken(session.id);
    res.json({ session, qr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Teacher: end a session
const endSession = async (req, res) => {
  const { session_id } = req.body;
  try {
    await pool.query(
      'UPDATE sessions SET is_active = false, ended_at = NOW() WHERE id = $1',
      [session_id]
    );
    res.json({ message: 'Session ended' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Teacher: refresh QR token
const refreshQR = async (req, res) => {
  const { session_id } = req.body;
  try {
    const qr = await generateQRToken(session_id);
    res.json(qr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student: mark attendance
const markAttendance = async (req, res) => {
  const { session_id, qr_token, latitude, longitude } = req.body;
  const student_id = req.user.id;
  const { device_id } = req.body;

// Check if device is already bound to another student
if (device_id) {
  const deviceCheck = await pool.query(
    'SELECT id, name FROM users WHERE device_id = $1 AND id != $2',
    [device_id, student_id]
  );
  if (deviceCheck.rows.length > 0) {
    return res.status(403).json({ 
      error: 'This device is already registered to another student' 
    });
  }
  // Bind device to this student if not already bound
  await pool.query(
    'UPDATE users SET device_id = $1 WHERE id = $2 AND device_id IS NULL',
    [device_id, student_id]
  );
}
  try {
    // Validate QR
    const validQR = await validateQRToken(session_id, qr_token);
    if (!validQR) return res.status(400).json({ error: 'Invalid or expired QR code' });

    // Get classroom location
    const sessionResult = await pool.query(
      'SELECT s.*, c.latitude, c.longitude, c.radius_meters FROM sessions s JOIN classrooms c ON c.subject_id = s.subject_id WHERE s.id = $1',
      [session_id]
    );
    const session = sessionResult.rows[0];
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.is_active) return res.status(400).json({ error: 'Session is not active' });

    // Validate geofence
    const withinFence = isWithinGeofence(
      parseFloat(latitude), parseFloat(longitude),
      parseFloat(session.latitude), parseFloat(session.longitude),
      session.radius_meters
    );
    if (!withinFence) return res.status(400).json({ error: 'You are not within the classroom' });

    // Mark attendance
    const result = await pool.query(
      'INSERT INTO attendance (session_id, student_id) VALUES ($1, $2) ON CONFLICT (session_id, student_id) DO NOTHING RETURNING *',
      [session_id, student_id]
    );
    res.json({ message: 'Attendance marked successfully', attendance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSessionAttendees = async (req, res) => {
  const { session_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT a.id, u.name, a.marked_at, a.status 
       FROM attendance a 
       JOIN users u ON u.id = a.student_id 
       WHERE a.session_id = $1`,
      [session_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyAttendance = async (req, res) => {
  const student_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT a.id, a.marked_at, a.status, sub.name as subject_name 
       FROM attendance a 
       JOIN sessions s ON s.id = a.session_id 
       JOIN subjects sub ON sub.id = s.subject_id 
       WHERE a.student_id = $1 
       ORDER BY a.marked_at DESC`,
      [student_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const setClassroomLocation = async (req, res) => {
  const { subject_id, latitude, longitude, radius_meters } = req.body;
  try {
    await pool.query(
      `INSERT INTO classrooms (subject_id, latitude, longitude, radius_meters)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (subject_id) DO UPDATE 
       SET latitude = $2, longitude = $3, radius_meters = $4`,
      [subject_id, latitude, longitude, radius_meters || 50]
    );
    res.json({ message: 'Classroom location set' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { startSession, endSession, refreshQR, markAttendance, getSessionAttendees, getMyAttendance, setClassroomLocation };