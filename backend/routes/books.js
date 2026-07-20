const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const upload = require('../middleware/upload');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');

router.get('/categories', bookController.getCategories);
router.get('/search', bookController.searchBooks);
router.get('/:id/download', authenticate, requireStudent, bookController.downloadEbook);
router.get('/:id', bookController.getBookById);

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  bookController.addBook
);
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  bookController.updateBook
);
router.delete('/:id', authenticate, requireAdmin, bookController.deleteBook);

module.exports = router;
