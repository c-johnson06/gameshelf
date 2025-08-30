import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.type === 'field' ? error.path : 'unknown',
                message: error.msg
            }))
        });
    }
    next();
};

// User validation rules
export const validateUserRegistration = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('username')
        .isLength({ min: 3, max: 32 })
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username must be 3-32 characters and contain only letters, numbers, underscores, and hyphens'),
    body('password')
        .isLength({ min: 8, max: 128 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must be 8-128 characters with at least one lowercase, one uppercase, and one number'),
    validateRequest
];

export const validateUserLogin = [
    body('username')
        .notEmpty()
        .trim()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validateRequest
];

// Game validation rules
export const validateGameData = [
    body('id')
        .isInt({ min: 1 })
        .withMessage('Game ID must be a positive integer'),
    body('name')
        .isLength({ min: 1, max: 255 })
        .trim()
        .withMessage('Game name is required and must be less than 255 characters'),
    body('playStatus')
        .optional()
        .isIn(['playing', 'completed', 'on-hold', 'dropped', 'plan-to-play'])
        .withMessage('Invalid play status'),
    validateRequest
];

export const validateReview = [
    body('personalRating')
        .optional()
        .isFloat({ min: 0, max: 10 })
        .withMessage('Rating must be between 0 and 10'),
    body('review')
        .optional()
        .isLength({ max: 2000 })
        .trim()
        .withMessage('Review must be less than 2000 characters'),
    validateRequest
];

// Parameter validation
export const validateUserId = [
    param('userId')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer'),
    validateRequest
];

export const validateGameId = [
    param('gameId')
        .isInt({ min: 1 })
        .withMessage('Game ID must be a positive integer'),
    validateRequest
];

// Query validation
export const validateSearchQuery = [
    query('query')
        .optional()
        .isLength({ min: 1, max: 100 })
        .trim()
        .withMessage('Search query must be 1-100 characters'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('page_size')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Page size must be between 1 and 50'),
    validateRequest
];