const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

// Generate JWT
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE
});

// @POST /api/auth/register  (Admin only — agents created by admin)
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (role === 'admin' && req.user?.role !== 'admin') {
    return next(new AppError('Not authorised to create admin accounts.', 403));
  }

  const user = await User.create({ name, email, password, role: role || 'agent' });

  sendResponse(res, 201, {
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  }, 'Account created successfully');
});

// @POST /api/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) return next(new AppError('Email and password are required.', 400));

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) return next(new AppError('Your account has been deactivated.', 401));

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);

  sendResponse(res, 200, {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  }, 'Login successful');
});

// @GET /api/auth/me
exports.getMe = catchAsync(async (req, res) => {
  sendResponse(res, 200, {
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }
  });
});

// @PUT /api/auth/change-password
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = newPassword;
  await user.save();

  const token = signToken(user._id);
  sendResponse(res, 200, { token }, 'Password changed successfully');
});
