const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getBooks, getBook, getBookPages,
  uploadBook, updateBook, deleteBook
} = require('../controllers/bookController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'pdf' && file.mimetype === 'application/pdf') cb(null, true);
    else if (file.fieldname === 'cover' && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  }
});

const uploadFields = upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]);

router.get('/', protect, getBooks);
router.get('/:id', protect, getBook);
router.get('/:id/pages', protect, getBookPages);
router.post('/', protect, restrictTo('admin'), uploadFields, uploadBook);
router.put('/:id', protect, restrictTo('admin'), updateBook);
router.delete('/:id', protect, restrictTo('admin'), deleteBook);

module.exports = router;