import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Unauthorized', 401);
  }
  const token = authHeader.slice('Bearer '.length);
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as { sub: string; email: string };
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    throw new AppError('Unauthorized', 401);
  }
}

