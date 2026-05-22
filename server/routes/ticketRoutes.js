const express = require('express');
const router = express.Router();
const { createTicket, getTickets, updateTicket, deleteTicket } = require('../controllers/ticketController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', createTicket);
router.get('/', getTickets);
router.put('/:id', updateTicket);      // removed restrictTo — admin check inside controller
router.delete('/:id', restrictTo('admin'), deleteTicket);

module.exports = router;