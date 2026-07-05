import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserUnauthorizedError, ForbiddenError } from '../utils/errors';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return next(new UserUnauthorizedError('Access token is missing or invalid'));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    next(new UserUnauthorizedError('Access token is expired or invalid'));
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UserUnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
};
