const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: 200
  },
  principalName: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  teacherName: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  designation: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  phoneNumber: {
    type: String,
    trim: true,
    maxlength: 20,
    default: ''
  },
  booksShown: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  outcome: {
    type: String,
    enum: ['interested', 'not_interested', 'follow_up', 'order_placed', 'pending'],
    default: 'pending'
  },
  selfieKey: {
    type: String,
    default: null
  },
  visitDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

visitSchema.index({ agentId: 1, visitDate: -1 });

module.exports = mongoose.model('Visit', visitSchema);