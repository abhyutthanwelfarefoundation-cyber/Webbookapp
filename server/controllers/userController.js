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
  const { name, email, isActive } = req.body;

  // Never update password through this route
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, isActive },
    { new: true, runValidators: true }
  ).select('-__v');

  if (!user) return next(new AppError('User not found.', 404));
  sendResponse(res, 200, { user }, 'User updated');
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
