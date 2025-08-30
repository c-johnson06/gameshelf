import { body, param, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for user registration
export const validateRegister = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('username').isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long').trim().escape(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

// Validation rules for user login
export const validateLogin = [
  body('username').isString().notEmpty().withMessage('Username is required').trim().escape(),
  body('password').isString().notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Validation for user and game IDs in URL parameters
export const validateUserAndGameIds = [
    param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer.'),
    param('gameId').isInt({ min: 1 }).withMessage('Game ID must be a positive integer.'),
    handleValidationErrors,
];

// Validation for updating a user's game entry
export const validateUpdateUserGame = [
    body('playStatus').optional().isIn(['playing', 'completed', 'on-hold', 'dropped', 'plan-to-play']).withMessage('Invalid play status.'),
    body('personalRating').optional({ nullable: true }).isFloat({ min: 0, max: 10 }).withMessage('Rating must be between 0 and 10.'),
    body('review').optional({ nullable: true }).isString().trim().escape(),
    handleValidationErrors
];