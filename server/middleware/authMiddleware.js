const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/User');

// Verify JWT and attach user to request
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(new AppError('Not authenticated. Please login.', 401));

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please login again.', 401));
  }

  // Check user still exists
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('User no longer exists.', 401));

  // Check user is active
  if (!user.isActive) return next(new AppError('Your account has been deactivated.', 401));

  // Check password not changed after token issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please login again.', 401));
  }

  req.user = user;
  next();
});

// Restrict to specific roles
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission for this action.', 403));
  }
  next();
};
