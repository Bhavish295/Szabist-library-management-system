const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');
const validate = require('../middleware/validate');

const issueRules = [
  body('student_id').isInt({ min: 1 }).withMessage('A valid student is required.'),
  body('book_id').isInt({ min: 1 }).withMessage('A valid book is required.'),
];
const returnRules = [body('issue_id').isInt({ min: 1 }).withMessage('A valid issue record is required.')];

router.get('/my', authenticate, requireStudent, issueController.getMyIssuedBooks);
router.get('/', authenticate, requireAdmin, issueController.getAllIssuedBooks);
router.post('/issue', authenticate, requireAdmin, issueRules, validate, issueController.issueBook);
router.post('/return', authenticate, requireAdmin, returnRules, validate, issueController.returnBook);

module.exports = router;
