const express = require('express');
const multer = require('multer');
const router = express.Router();
const { createVisit, getVisits, getVisitStats, deleteVisit } = require('../controllers/visitController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
});

router.use(protect);
router.get('/stats', restrictTo('admin'), getVisitStats);
router.get('/', getVisits);
router.post('/', upload.single('selfie'), createVisit);
router.delete('/:id', deleteVisit);

module.exports = router;