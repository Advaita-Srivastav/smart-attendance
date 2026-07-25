const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const subjectRoutes = require('./routes/subjects');
const pool = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/subjects', subjectRoutes);

const connectedStudents = {};

io.on('connection', (socket) => {
  socket.on('register_student', (studentId) => {
    connectedStudents[studentId] = socket.id;
    console.log(`Student ${studentId} connected`);
  });

  socket.on('recheck_response', async ({ attendanceId, passed }) => {
    try {
      await pool.query(
        'UPDATE rechecks SET responded_at = NOW(), passed = $1 WHERE attendance_id = $2 AND responded_at IS NULL',
        [passed, attendanceId]
      );
      if (!passed) {
        await pool.query(
          'UPDATE attendance SET status = $1 WHERE id = $2',
          ['absent', attendanceId]
        );
      }
    } catch (err) {
      console.error('Recheck error:', err);
    }
  });

  socket.on('disconnect', () => {
    Object.keys(connectedStudents).forEach(key => {
      if (connectedStudents[key] === socket.id) delete connectedStudents[key];
    });
  });
});

app.set('io', io);
app.set('connectedStudents', connectedStudents);

app.post('/api/attendance/trigger-recheck', async (req, res) => {
  const { session_id } = req.body;
  try {
    const result = await pool.query(
      'SELECT a.id, a.student_id FROM attendance a WHERE a.session_id = $1 AND a.status = $2',
      [session_id, 'present']
    );
    const students = result.rows;
    const delay = () => new Promise(r => setTimeout(r, Math.random() * 60000 + 30000));
    students.forEach(async (student) => {
      await delay();
      const socketId = connectedStudents[student.student_id];
      if (socketId) {
        await pool.query(
          'INSERT INTO rechecks (attendance_id) VALUES ($1)',
          [student.id]
        );
        io.to(socketId).emit('recheck_request', { attendanceId: student.id });
      }
    });
    res.json({ message: 'Rechecks scheduled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.json({ message: 'Smart Attendance API running' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));