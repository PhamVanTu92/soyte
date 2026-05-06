/**
 * Utility functions for sending standardized API responses.
 */

const success = (res, data, message = 'Success', statusCode = 200, meta = undefined) => {
    const payload = {
        success: true,
        message,
    };
    if (data !== undefined) payload.data = data;
    if (meta !== undefined) payload.meta = meta;
    res.status(statusCode).json(payload);
};

const created = (res, data, message = 'Resource created successfully.') => {
    success(res, data, message, 201);
};

const error = (res, message = 'An error occurred.', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
    };
    if (errors) {
        response.errors = errors;
    }
    res.status(statusCode).json(response);
};

const badRequest = (res, message = 'Bad Request', errors = null) => {
    error(res, message, 400, errors);
};

const unauthorized = (res, message = 'Unauthorized') => {
    error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden') => {
    error(res, message, 403);
};

const notFound = (res, message = 'Resource not found.') => {
    error(res, message, 404);
};

module.exports = {
    success,
    created,
    error,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
};
