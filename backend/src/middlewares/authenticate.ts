import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User.model';

/**
 * Verifies the Bearer access token, confirms the user still exists,
 * is active, and is not banned, then attaches { id, role } to req.user.
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    let token: string | undefined;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (typeof req.query?.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication token missing');
    }

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select('_id role isActive isBanned');
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');
    if (user.isBanned) throw ApiError.forbidden('This account has been banned');

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

/** Attaches req.user if a valid token is present, but never rejects the request. Useful for public routes with optional personalization. */
export const attachUserIfPresent = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return next();
    const payload = verifyAccessToken(header.split(' ')[1]);
    const user = await User.findById(payload.sub).select('_id role isActive isBanned');
    if (user && user.isActive && !user.isBanned) {
      req.user = { id: user.id, role: user.role };
    }
    next();
  } catch {
    next();
  }
};
