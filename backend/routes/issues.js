const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');

router.get('/my', authenticate, requireStudent, issueController.getMyIssuedBooks);
router.get('/', authenticate, requireAdmin, issueController.getAllIssuedBooks);
router.post('/issue', authenticate, requireAdmin, issueController.issueBook);
router.post('/return', authenticate, requireAdmin, issueController.returnBook);

module.exports = router;
