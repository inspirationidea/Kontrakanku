import { error } from '../utils/response.js';

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log full error in development mode
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.error('[Error Handler] Caught error:', err);
  }

  // Handle Prisma Database Errors
  if (err.code && err.code.startsWith('P')) {
    let statusCode = 400;
    let message = 'Database transaction error';
    let details = null;

    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A unique constraint violation occurred.';
        // Extract field name from err.meta
        if (err.meta && err.meta.target) {
          details = { fields: err.meta.target };
          message = `An record with this ${err.meta.target.join(', ')} already exists.`;
        }
        break;
      case 'P2025':
        statusCode = 404;
        message = err.meta?.cause || 'Requested record was not found.';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed. Related record does not exist.';
        break;
    }

    return error(res, message, statusCode, details);
  }

  // Handle Express Multer Upload Errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file is too large. Max size is 5MB.';
    }
    return error(res, message, 400, { multerCode: err.code });
  }

  // Handle generic JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid authentication token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Authentication token has expired', 401);
  }

  // Handle standard status-carrying errors
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  return error(res, message, status, err.details || null);
};

export default errorHandler;
