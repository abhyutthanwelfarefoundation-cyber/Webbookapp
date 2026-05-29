const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  getAllCategories, getChildren, getCategory,
  createCategory, updateCategory, deleteCategory
} = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for cover images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

router.get('/', protect, getAllCategories);
router.get('/:id', protect, getCategory);
router.get('/:id/children', protect, getChildren);
router.post('/', protect, restrictTo('admin'), upload.single('cover'), createCategory);
router.put('/:id', protect, restrictTo('admin'), upload.single('cover'), updateCategory);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);

module.exports = router;