const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, studentController.getAdminDashboard);

module.exports = router;
