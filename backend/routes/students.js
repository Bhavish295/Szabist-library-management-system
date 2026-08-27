const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');
const validate = require('../middleware/validate');

const idParamRule = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];

router.get('/dashboard', authenticate, requireStudent, studentController.getStudentDashboard);
router.get('/', authenticate, requireAdmin, studentController.getAllStudents);
router.put('/:id/toggle-block', authenticate, requireAdmin, idParamRule, validate, studentController.toggleBlock);

module.exports = router;
