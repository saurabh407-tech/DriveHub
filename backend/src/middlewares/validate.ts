import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';

/** Runs after an array of express-validator checks; rejects with a 400 and a field-level error map if any check failed. */
export const validate = (req: Request, _res: Response, next: NextFunction) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().reduce<Record<string, string>>((acc, err) => {
    if (err.type === 'field' && !acc[err.path]) {
      acc[err.path] = err.msg;
    }
    return acc;
  }, {});

  next(ApiError.badRequest('Validation failed', errors));
};
