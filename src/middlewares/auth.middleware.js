const jwtUtil = require('../utils/jwt.util');
const UserModel = require('../models/user.model');
const { UnauthorizedError, ForbiddenError } = require('../utils/customError.util');

class AuthMiddleware {
  /**
   * Verify JWT token and authenticate user
   */
  async authenticate(req, res, next) {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.split(' ')[1];

      // Verify token
      const decoded = jwtUtil.verifyAccessToken(token);

      // Get user from database
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.is_active) {
        throw new ForbiddenError('Account is deactivated');
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: user.is_verified
      };

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user's email is verified
   */
  requireVerifiedEmail(req, res, next) {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!req.user.is_verified) {
      return next(new ForbiddenError('Email verification required'));
    }

    next();
  }

  /**
   * Optional authentication (doesn't fail if no token)
   */
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwtUtil.verifyAccessToken(token);
      const user = await UserModel.findById(decoded.userId);

      if (user && user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_verified: user.is_verified
        };
      }

      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  }
}

module.exports = new AuthMiddleware();
