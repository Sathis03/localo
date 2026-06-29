import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'Super Admin' | 'Agency Owner' | 'Agency Staff' | 'Business Owner';
    agencyId?: string;
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'super_secret_localrank_pro_key_12345';

    try {
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
        role: 'Super Admin' | 'Agency Owner' | 'Agency Staff' | 'Business Owner';
        agencyId?: string;
      };
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }
  }

  return res.status(401).json({ error: 'Unauthorized: Authentication token is missing' });
};

export const requireRoles = (roles: Array<'Super Admin' | 'Agency Owner' | 'Agency Staff' | 'Business Owner'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User authentication is required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource' });
    }

    return next();
  };
};
