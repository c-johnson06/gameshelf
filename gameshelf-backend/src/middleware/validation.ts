import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

// Validation schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').max(128),
    username: z.string().min(3, 'Username must be at least 3 characters').max(32).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const reviewSchema = z.object({
  body: z.object({
    personalRating: z.number().min(0).max(10).optional().nullable(),
    review: z.string().max(2000, 'Review must be less than 2000 characters').optional().nullable(),
    playStatus: z.enum(['playing', 'completed', 'on-hold', 'dropped', 'plan-to-play']).optional(),
  }),
  params: z.object({
    userId: z.string().regex(/^\d+$/, 'Invalid user ID'),
    gameId: z.string().regex(/^\d+$/, 'Invalid game ID'),
  }),
});