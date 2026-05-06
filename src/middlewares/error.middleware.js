const ApiError = require('../utils/ApiError');

/**
 * Generic error handler middleware.
 * @param {Error|ApiError} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // CORS errors → 403
  if (message && message.startsWith('Not allowed by CORS')) {
    return res.status(403).json({
      success: false,
      status: 'error',
      statusCode: 403,
      message,
    });
  }

  // Set default status code if not provided
  if (!statusCode) {
    statusCode = 500;
  }

  // If message is missing, provide a default
  if (!message && statusCode === 500) {
    message = 'An unexpected error occurred';
  }

  // Log non-operational errors as errors, and operational errors as warnings (optional)
  if (err.isOperational === false) {
    console.error('PROGRAMMING ERROR:', err);
  } else if (statusCode === 500) {
    console.error('UNEXPECTED ERROR:', err.stack);
  }

  res.status(statusCode).json({
    success: false,
    status: 'error',
    statusCode,
    message,
    ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
