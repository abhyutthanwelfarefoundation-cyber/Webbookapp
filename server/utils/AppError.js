// Custom error class — carries HTTP status code
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // our own errors, not bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
