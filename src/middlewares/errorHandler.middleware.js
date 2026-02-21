const { CustomError } = require('../utils/customError.util');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle custom errors
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle MySQL duplicate entry errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      status: 'fail',
      message: 'Duplicate entry. Resource already exists.',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }

  // Handle MySQL foreign key constraint errors
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      status: 'fail',
      message: 'Referenced resource does not exist.',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Token has expired',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }

  // Handle validation errors from express-validator
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid JSON payload',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }

  // Handle payload too large errors
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      status: 'fail',
      message: 'Payload too large'
    });
  }

  // Handle CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      status: 'fail',
      message: 'CORS policy violation'
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
