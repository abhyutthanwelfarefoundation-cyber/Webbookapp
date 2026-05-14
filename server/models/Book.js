const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  pdfKey: {
    type: String,  // S3/R2 object key for original PDF
    required: true
  },
  coverKey: {
    type: String,  // S3/R2 object key for cover image
    default: null
  },
  pageImageKeys: {
    type: [String], // Pre-generated page image keys
    default: []
  },
  totalPages: {
    type: Number,
    default: 0
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'done', 'failed'],
    default: 'pending'
  }
}, { timestamps: true });

// Index for fast category lookup
bookSchema.index({ categoryId: 1, isActive: 1 });
bookSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Book', bookSchema);
