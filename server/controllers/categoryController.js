const Category = require('../models/Category');
const Book = require('../models/Book');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { uploadToS3 } = require('../services/s3Service');

const SUPABASE = 'https://etvgnlxumsytyhqtezmb.supabase.co/storage/v1/object/public/digital-books';

// @GET /api/categories — full tree
exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('order name');

  const withCovers = categories.map(cat => ({
    ...cat.toObject(),
    coverUrl: cat.coverKey ? `${SUPABASE}/${cat.coverKey}` : null
  }));

  const buildTree = (items, parentId = null) =>
    items
      .filter(i => String(i.parentId || null) === String(parentId))
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

// @POST /api/categories (Admin only)
exports.createCategory = catchAsync(async (req, res) => {
  const { name, parentId, order } = req.body;

  let coverKey = null;
  if (req.file) {
    coverKey = `categories/${Date.now()}-cover.jpg`;
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

// @PUT /api/categories/:id (Admin only)
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name, parentId, order, isActive } = req.body;

  if (parentId && String(parentId) === String(req.params.id)) {
    return next(new AppError('Category cannot be its own parent.', 400));
  }

  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));

  // Update fields
  if (name !== undefined) category.name = name;
  if (parentId !== undefined) category.parentId = parentId || null;
  if (order !== undefined) category.order = order;
  if (isActive !== undefined) category.isActive = isActive;

  // Handle cover upload
  if (req.file) {
    const coverKey = `categories/${req.params.id}-cover-${Date.now()}.jpg`;
    await uploadToS3(coverKey, req.file.buffer, req.file.mimetype);
    category.coverKey = coverKey;
  }

  await category.save({ validateBeforeSave: false });

  const obj = category.toObject();
  if (category.coverKey) obj.coverUrl = `${SUPABASE}/${category.coverKey}`;

  sendResponse(res, 200, { category: obj }, 'Category updated');
});

// @DELETE /api/categories/:id (Admin only)
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));

  const hasChildren = await Category.exists({ parentId: req.params.id });
  if (hasChildren) return next(new AppError('Remove child categories first.', 400));

  const hasBooks = await Book.exists({ categoryId: req.params.id });
  if (hasBooks) return next(new AppError('Move or delete books in this category first.', 400));

  await category.deleteOne();
  sendResponse(res, 200, {}, 'Category deleted');
});