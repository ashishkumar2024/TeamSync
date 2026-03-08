import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors';
import { logger } from '../../config/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, 'AppError');
    }
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    error: 'Internal server error',
  });
}

