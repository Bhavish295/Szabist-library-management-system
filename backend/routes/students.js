const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');

router.get('/dashboard', authenticate, requireStudent, studentController.getStudentDashboard);
router.get('/', authenticate, requireAdmin, studentController.getAllStudents);
router.put('/:id/toggle-block', authenticate, requireAdmin, studentController.toggleBlock);

module.exports = router;
