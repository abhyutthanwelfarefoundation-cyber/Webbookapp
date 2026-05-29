const Category = require('../models/Category');
const Book = require('../models/Book');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

// @GET /api/categories  — full tree
exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('order name');

  const SUPABASE = 'https://adoiilauzxxffnwlnono.supabase.co/storage/v1/object/public/digital-books';

  const withCovers = categories.map(cat => ({
    ...cat.toObject(),
    coverUrl: cat.coverKey ? `${SUPABASE}/${cat.coverKey}` : null
  }));

  const buildTree = (items, parentId = null) =>
    items
      .filter(i => String(i.parentId) === String(parentId))
      .map(i => ({ ...i, children: buildTree(items, i._id) }));

  const tree = buildTree(withCovers);
  sendResponse(res, 200, { categories: tree });
});

// @GET /api/categories/:id/children
exports.getChildren = catchAsync(async (req, res) => {
  const children = await Category.find({
    parentId: req.params.id,
    isActive: true
  }).sort('order name');
  sendResponse(res, 200, { children });
});

// @GET /api/categories/:id
exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate('parentId', 'name slug');
  if (!category) return next(new AppError('Category not found.', 404));
  sendResponse(res, 200, { category });
});

// @POST /api/categories  (Admin only)
exports.createCategory = catchAsync(async (req, res) => {
  const { name, parentId, order } = req.body;

  let coverKey = null;
  if (req.file) {
    const { uploadToS3, keys } = require('../services/s3Service');
    const tempId = new Date().getTime().toString();
    coverKey = `categories/${tempId}-cover.jpg`;
    await uploadToS3(coverKey, req.file.buffer, req.file.mimetype);
  }

  const category = await Category.create({
    name,
    parentId: parentId || null,
    order: order || 0,
    coverKey
  });

  sendResponse(res, 201, { category }, 'Category created');
});

// @PUT /api/categories/:id  (Admin only)
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name, parentId, order, isActive } = req.body;

  if (parentId && String(parentId) === String(req.params.id)) {
    return next(new AppError('Category cannot be its own parent.', 400));
  }

  let updateData = { name, isActive };
  if (parentId !== undefined) updateData.parentId = parentId || null;
  if (order !== undefined) updateData.order = order;

  // Handle new cover image upload
  if (req.file) {
    const { uploadToS3 } = require('../services/s3Service');
    const coverKey = `categories/${req.params.id}-cover${Date.now()}.jpg`;
    await uploadToS3(coverKey, req.file.buffer, req.file.mimetype);
    updateData.coverKey = coverKey;
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!category) return next(new AppError('Category not found.', 404));
  sendResponse(res, 200, { category }, 'Category updated');
});

// @DELETE /api/categories/:id  (Admin only)
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));

  // Check for child categories
  const hasChildren = await Category.exists({ parentId: req.params.id });
  if (hasChildren) return next(new AppError('Remove child categories first.', 400));

  // Check for books
  const hasBooks = await Book.exists({ categoryId: req.params.id });
  if (hasBooks) return next(new AppError('Move or delete books in this category first.', 400));

  await category.deleteOne();
  sendResponse(res, 200, {}, 'Category deleted');
});


