const Book = require('../models/Book');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { uploadToS3, getSignedUrl, deleteFromS3, keys } = require('../services/s3Service');
const { processPdf, generateCover } = require('../services/pdfService');

// @GET /api/books?categoryId=xxx&search=xxx
exports.getBooks = catchAsync(async (req, res) => {
  const { categoryId, search, page = 1, limit = 20 } = req.query;
  const query = { isActive: true };

  if (categoryId) query.categoryId = categoryId;
  if (search) query.$text = { $search: search };

  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    Book.find(query)
      .select('-pageImageKeys -pdfKey -__v')
      .populate('categoryId', 'name slug')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Book.countDocuments(query)
  ]);

  // Attach signed cover URLs
  const booksWithCovers = await Promise.all(books.map(async (book) => {
    const obj = book.toObject();
    if (book.coverKey) {
      obj.coverUrl = await getSignedUrl(book.coverKey, 3600);
    } else if (book.pdfKey) {
      // Use first page as cover via public URL
      obj.coverUrl = null;
    }
    return obj;
  }));

  sendResponse(res, 200, {
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    books: booksWithCovers
  });
});

// @GET /api/books/:id
exports.getBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id)
    .select('-pageImageKeys -pdfKey -__v')
    .populate('categoryId', 'name slug');

  if (!book || !book.isActive) return next(new AppError('Book not found.', 404));

  const obj = book.toObject();
  if (book.coverKey) obj.coverUrl = await getSignedUrl(book.coverKey, 3600);

  sendResponse(res, 200, { book: obj });
});

// @GET /api/books/:id/pages — returns signed PDF URL for direct rendering
exports.getBookPages = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id).select('pdfKey isActive processingStatus');
  if (!book || !book.isActive) return next(new AppError('Book not found.', 404));

  if (book.processingStatus !== 'done') {
    return next(new AppError(`Book is still ${book.processingStatus}. Try again shortly.`, 400));
  }

  const pdfUrl = await getSignedUrl(book.pdfKey, 3600);
  sendResponse(res, 200, { pdfUrl });
});

// @POST /api/books  (Admin only — multipart/form-data)
exports.uploadBook = catchAsync(async (req, res, next) => {
  if (!req.files?.pdf?.[0]) return next(new AppError('PDF file is required.', 400));

  const { title, description, categoryId } = req.body;
  if (!title || !categoryId) return next(new AppError('Title and category are required.', 400));

  const book = await Book.create({
    title,
    description,
    categoryId,
    pdfKey: 'pending',
    fileSize: req.files.pdf[0].size,
    uploadedBy: req.user._id,
    processingStatus: 'pending'
  });

  sendResponse(res, 201, {
    book: { id: book._id, title: book.title, processingStatus: book.processingStatus }
  }, 'Book uploaded. Processing...');

  (async () => {
    try {
      book.processingStatus = 'processing';
      await book.save({ validateBeforeSave: false });

      const pdfBuffer = req.files.pdf[0].buffer;
      const pdfKey = keys.pdf(book._id);
      await uploadToS3(pdfKey, pdfBuffer, 'application/pdf');

      // Page count
      let totalPages = 0;
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(pdfBuffer);
        totalPages = pdfData.numpages;
      } catch (e) {
        const str = pdfBuffer.toString('binary');
        const matches = str.match(/\/Type\s*\/Page[^s]/g);
        totalPages = matches ? matches.length : 0;
      }

      // Cover image — use uploaded cover or generate random gradient cover
      let coverKey = null;
      if (req.files?.cover?.[0]) {
        // Admin uploaded a cover image
        const coverBuffer = req.files.cover[0].buffer;
        coverKey = keys.cover(book._id);
        await uploadToS3(coverKey, coverBuffer, req.files.cover[0].mimetype);
      } else {
        // Generate colorful SVG cover based on title
        const colors = [
          ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'],
          ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'],
          ['#fa709a', '#fee140'], ['#a18cd1', '#fbc2eb'],
          ['#fda085', '#f6d365'], ['#96fbc4', '#f9f586']
        ];
        const colorPair = colors[Math.floor(Math.random() * colors.length)];
        const initials = title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

        const svgCover = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="566">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${colorPair[0]}"/>
              <stop offset="100%" style="stop-color:${colorPair[1]}"/>
            </linearGradient>
          </defs>
          <rect width="400" height="566" fill="url(#g)" rx="8"/>
          <rect x="20" y="20" width="360" height="526" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" rx="4"/>
          <text x="200" y="240" font-family="Georgia,serif" font-size="80" fill="rgba(255,255,255,0.3)" text-anchor="middle">${initials}</text>
          <text x="200" y="360" font-family="Georgia,serif" font-size="22" fill="white" text-anchor="middle" font-weight="bold">${title.length > 24 ? title.substring(0, 24) + '...' : title}</text>
          <rect x="160" y="380" width="80" height="2" fill="rgba(255,255,255,0.5)"/>
        </svg>`;

        const svgBuffer = Buffer.from(svgCover);
        coverKey = keys.cover(book._id).replace('.jpg', '.svg');
        await uploadToS3(coverKey, svgBuffer, 'image/svg+xml');
      }

      book.pdfKey = pdfKey;
      book.coverKey = coverKey;
      book.totalPages = totalPages;
      book.processingStatus = 'done';
      await book.save({ validateBeforeSave: false });

      console.log(`✅ Book uploaded: ${book.title} (${totalPages} pages)`);
    } catch (err) {
      book.processingStatus = 'failed';
      await book.save({ validateBeforeSave: false });
      console.error(`❌ Book upload failed: ${book.title}`, err.message);
    }
  })();
});
// @PUT /api/books/:id  (Admin only)
exports.updateBook = catchAsync(async (req, res, next) => {
  const { title, description, categoryId, isActive } = req.body;
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { title, description, categoryId, isActive },
    { new: true, runValidators: true }
  );
  if (!book) return next(new AppError('Book not found.', 404));
  sendResponse(res, 200, { book }, 'Book updated');
});

// @DELETE /api/books/:id  (Admin only)
exports.deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) return next(new AppError('Book not found.', 404));

  // Delete all S3 files
  const deletePromises = [
    book.pdfKey && deleteFromS3(book.pdfKey),
    book.coverKey && deleteFromS3(book.coverKey),
    ...book.pageImageKeys.map(k => deleteFromS3(k))
  ].filter(Boolean);

  await Promise.allSettled(deletePromises);
  await book.deleteOne();

  sendResponse(res, 200, {}, 'Book deleted');
});
