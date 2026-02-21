const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('./customError.util');

class JWTUtil {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpire = process.env.JWT_EXPIRE || '7d';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.refreshExpire = process.env.JWT_REFRESH_EXPIRE || '30d';
  }

  /**
   * Generate access token
   * @param {Object} payload - Data to encode in token
   * @returns {string} JWT token
   */
  generateAccessToken(payload) {
    try {
      return jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpire,
        issuer: 'auth-service',
        audience: 'auth-client'
      });
    } catch (error) {
      throw new Error('Error generating access token');
    }
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Data to encode in token
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, this.refreshSecret, {
        expiresIn: this.refreshExpire,
        issuer: 'auth-service',
        audience: 'auth-client'
      });
    } catch (error) {
      throw new Error('Error generating refresh token');
    }
  }

  /**
   * Verify access token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'auth-service',
        audience: 'auth-client'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid access token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token to verify
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        issuer: 'auth-service',
        audience: 'auth-client'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw new UnauthorizedError('Refresh token verification failed');
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token
   * @returns {Object} Decoded token
   */
  decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Generate password reset token
   * @param {Object} payload - User data
   * @returns {string} Reset token
   */
  generatePasswordResetToken(payload) {
    try {
      return jwt.sign(payload, this.jwtSecret, {
        expiresIn: '1h',
        issuer: 'auth-service',
        audience: 'password-reset'
      });
    } catch (error) {
      throw new Error('Error generating password reset token');
    }
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {Object} Decoded token
   */
  verifyPasswordResetToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'auth-service',
        audience: 'password-reset'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Password reset token has expired');
      }
      throw new UnauthorizedError('Invalid password reset token');
    }
  }
}

module.exports = new JWTUtil();
