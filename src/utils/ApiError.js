/**
 * Custom Error class for API responses with status code support.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message   - Error message
   * @param {Array}  [errors]  - Mảng lỗi chi tiết (vd: từ express-validator)
   * @param {boolean} [isOperational=true]
   */
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = Array.isArray(errors) ? errors : [];
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
