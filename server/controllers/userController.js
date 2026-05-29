const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

// @GET /api/users  (Admin only)
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find({ role: 'agent' }).select('-__v').sort('-createdAt');
  sendResponse(res, 200, { count: users.length, users });
});

// @GET /api/users/:id
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-__v');
  if (!user) return next(new AppError('User not found.', 404));
  sendResponse(res, 200, { user });
});

// @PUT /api/users/:id  (Admin only)
exports.updateUser = catchAsync(async (req, res, next) => {
  const { name, email, isActive, password } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  if (name) user.name = name;
  if (email) user.email = email;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = password; // will be hashed by pre-save hook

  await user.save();

  sendResponse(res, 200, {
    user: { id: user._id, name: user.name, email: user.email, isActive: user.isActive, role: user.role }
  }, 'Agent updated');
});

// @DELETE /api/users/:id  (Admin only)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  // Soft delete — deactivate instead of hard delete
  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  sendResponse(res, 200, {}, 'Agent account deactivated');
});
