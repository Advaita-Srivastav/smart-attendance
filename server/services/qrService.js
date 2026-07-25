const crypto = require('crypto');
const pool = require('../config/db');

const generateQRToken = async (sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30000);

  await pool.query(
    'UPDATE sessions SET qr_token = $1, qr_expires_at = $2 WHERE id = $3',
    [token, expiresAt, sessionId]
  );

  return { token, expiresAt };
};

const validateQRToken = async (sessionId, token) => {
  const result = await pool.query(
    'SELECT qr_token, qr_expires_at FROM sessions WHERE id = $1',
    [sessionId]
  );
  const session = result.rows[0];
  if (!session) return false;
  if (session.qr_token !== token) return false;
  if (new Date() > new Date(session.qr_expires_at)) return false;
  return true;
};

module.exports = { generateQRToken, validateQRToken };