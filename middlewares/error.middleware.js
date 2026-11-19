import { logger } from '../utils/logger.js';

// Custom error creator function
export const errorHandler = (statusCode, message) => {
  const error = new Error();
  error.statusCode = statusCode;
  error.message = message;
  return error;
};

// Global Error Middleware
export const globalErrorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with that ${field} already exists.`;
  }

  // Client mistakes (4xx) are expected traffic; only server faults are errors.
  logger.log(
    statusCode >= 500 ? 'error' : 'warn',
    `[${req.method}] ${req.originalUrl} >> StatusCode:: ${statusCode}, Message:: ${message}`
  );

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    // Add stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
