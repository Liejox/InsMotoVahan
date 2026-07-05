import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn(`Validation Error on ${req.method} ${req.originalUrl}: ${JSON.stringify(errors)}`);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors,
    });
  }

  // 2. Custom App Error
  if (err instanceof AppError) {
    logger.warn(`Operational Error [${err.statusCode}] on ${req.method} ${req.originalUrl}: ${err.message}`);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // 3. JWT specific errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid authorization token',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Authorization token expired',
    });
  }

  // 4. Fallback Internal Server Error
  logger.error(`Unhandled Exception on ${req.method} ${req.originalUrl}:`, err);
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
