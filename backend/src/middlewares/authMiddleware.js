import { verifyToken } from '../utils/auth.js';
import { error } from '../utils/response.js';
import prisma from '../config/prisma.js';

/**
 * Middleware to authenticate requests via JWT Bearer Token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch user from DB to ensure they still exist and check latest info
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user) {
      return error(res, 'User no longer exists.', 401);
    }

    // Attach user information to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to restrict route to specific roles
 * @param {string[]} roles - Allowed roles (e.g. ['ADMIN', 'SUPERADMIN'])
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(res, 'Forbidden. You do not have permission to access this resource.', 403);
    }

    next();
  };
};

/**
 * Middleware to require KTP verification status to be true
 */
export const requireVerification = (req, res, next) => {
  if (!req.user) {
    return error(res, 'Authentication required.', 401);
  }

  // Admin/Superadmin bypass KTP verification
  if (req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN') {
    return next();
  }

  if (!req.user.isVerified) {
    return error(
      res, 
      'KTP verification required. Please wait for an administrator to verify your identity.', 
      403
    );
  }

  next();
};
