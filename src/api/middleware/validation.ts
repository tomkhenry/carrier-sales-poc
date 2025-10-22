import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Middleware to check validation results from express-validator
 * Use after validation chains
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.type === 'field' ? (err as any).path : 'unknown',
      message: err.msg
    }));

    throw new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      errorMessages
    );
  }
  
  next();
};

/**
 * Helper to run validation chains and check results
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.type === 'field' ? (err as any).path : 'unknown',
        message: err.msg
      }));

      return next(new AppError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        errorMessages
      ));
    }

    next();
  };
};

export default validateRequest;

