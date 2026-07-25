const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getSubjects, createSubject } = require('../controllers/subjectsController');
const { deleteSubject } = require('../controllers/subjectsController');
router.delete('/:id', verifyToken, deleteSubject);
router.get('/', verifyToken, getSubjects);
router.post('/', verifyToken, createSubject);

module.exports = router;