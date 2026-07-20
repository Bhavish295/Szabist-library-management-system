const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, requireStudent } = require('../middleware/auth');

router.get('/', authenticate, requireStudent, notificationController.getNotifications);
router.get('/unread-count', authenticate, requireStudent, notificationController.getUnreadCount);
router.put('/:id/read', authenticate, requireStudent, notificationController.markAsRead);
router.put('/read-all', authenticate, requireStudent, notificationController.markAllRead);

module.exports = router;
