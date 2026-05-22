const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['password_reset', 'account_issue', 'book_issue', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open'
  },
  adminNote: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  resolvedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);