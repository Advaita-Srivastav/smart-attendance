const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const {
  startSession,
  endSession,
  refreshQR,
  markAttendance
} = require('../controllers/attendanceController');

router.post('/session/start', verifyToken, startSession);
router.post('/session/end', verifyToken, endSession);
router.post('/session/refresh-qr', verifyToken, refreshQR);
router.post('/mark', verifyToken, markAttendance);

const { getSessionAttendees, getMyAttendance } = require('../controllers/attendanceController');
router.get('/session/:session_id', verifyToken, getSessionAttendees);
router.get('/my-attendance', verifyToken, getMyAttendance);

const { setClassroomLocation } = require('../controllers/attendanceController');
router.post('/classroom/set-location', verifyToken, setClassroomLocation);

module.exports = router;