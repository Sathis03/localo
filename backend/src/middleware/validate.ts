import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';

// Generic validation middleware
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.slice(1).join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Registration validation schema
export const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .trim(),
    email: z.string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .trim()
      .toLowerCase(),
    password: z.string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password cannot exceed 100 characters'),
    role: z.enum(['Super Admin', 'Agency Owner', 'Agency Staff', 'Business Owner'], {
      required_error: 'Role is required and must be one of: Super Admin, Agency Owner, Agency Staff, Business Owner',
    }),
    agencyName: z.string().trim().optional(),
  }),
});

// Login validation schema
export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .trim()
      .toLowerCase(),
    password: z.string({ required_error: 'Password is required' }),
  }),
});
