import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

/**
 * Standard error response interface
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Global error handler middleware
 * Catches all errors and sends standardized error responses
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('Error occurred:', err);

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code,
      details: err.details
    },
    timestamp: new Date().toISOString()
  };

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development' && err.stack) {
    (errorResponse.error as any).stack = err.stack;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error: any = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default errorHandler;

