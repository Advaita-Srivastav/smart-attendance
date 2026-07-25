const pool = require('../config/db');

const getSubjects = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subjects WHERE teacher_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSubject = async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO subjects (name, teacher_id) VALUES ($1, $2) RETURNING *',
      [name, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteSubject = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM subjects WHERE id = $1 AND teacher_id = $2', [id, req.user.id]);
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSubjects, createSubject, deleteSubject };