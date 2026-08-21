import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Single place that turns any thrown error into a consistent JSON shape.
 * Handles ApiError, Mongoose validation/cast/duplicate-key errors, JWT
 * errors, and falls back to a generic 500 for anything unexpected.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err?.name === 'ValidationError') {
    // Mongoose schema validation error
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(
      Object.entries(err.errors || {}).map(([field, e]: [string, any]) => [field, e.message])
    );
  } else if (err?.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  } else if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with this ${field} already exists`;
  } else if (err?.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err?.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  if (statusCode >= 500) {
    logger.error(message, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(env.isProd ? {} : { stack: err?.stack }),
  });
};
