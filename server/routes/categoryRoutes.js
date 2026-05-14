const express = require('express');
const router = express.Router();
const {
  getAllCategories, getChildren, getCategory,
  createCategory, updateCategory, deleteCategory
} = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/', protect, getAllCategories);
router.get('/:id', protect, getCategory);
router.get('/:id/children', protect, getChildren);
router.post('/', protect, restrictTo('admin'), createCategory);
router.put('/:id', protect, restrictTo('admin'), updateCategory);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);

module.exports = router;
