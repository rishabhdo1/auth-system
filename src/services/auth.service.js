const UserModel = require('../models/user.model');
const OTPService = require('./otp.service');
const EmailService = require('./email.service');
const bcryptUtil = require('../utils/bcrypt.util');
const jwtUtil = require('../utils/jwt.util');
const { pool } = require('../config/database');
const {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError
} = require('../utils/customError.util');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data and message
   */
  async register(userData) {
    try {
      // Create user
      const user = await UserModel.create(userData);

      // Generate OTP for email verification
      const otp = await OTPService.createOTP(user.id, 'email_verification');

      // Send verification email
      await EmailService.sendVerificationEmail(user.email, otp);

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_verified: user.is_verified
        },
        message: 'Registration successful. Please check your email for verification OTP.'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email using OTP
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmail(email, otp) {
    try {
      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.is_verified) {
        throw new ValidationError('Email already verified');
      }

      const isValid = await OTPService.verifyOTP(user.id, otp, 'email_verification');

      if (!isValid) {
        throw new UnauthorizedError('Invalid or expired OTP');
      }

      await UserModel.verifyEmail(user.id);

      return {
        message: 'Email verified successfully. You can now login.'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend verification OTP
   * @param {string} email - User email
   * @returns {Promise<Object>} Result message
   */
  async resendVerificationOTP(email) {
    try {
      const user = await UserModel.findByEmail(email);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.is_verified) {
        throw new ValidationError('Email already verified');
      }

      const otp = await OTPService.createOTP(user.id, 'email_verification');
      await EmailService.sendVerificationEmail(user.email, otp);

      return {
        message: 'Verification OTP sent to your email'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Tokens and user data
   */
  async login(email, password) {
    try {
      const user = await UserModel.findByEmail(email);

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check if account is locked
      const lockStatus = await UserModel.isAccountLocked(user.id);
      if (lockStatus.isLocked) {
        const minutes = Math.ceil((new Date(lockStatus.lockedUntil) - new Date()) / 60000);
        throw new ForbiddenError(
          `Account is locked due to multiple failed login attempts. Please try again in ${minutes} minutes.`
        );
      }

      // Verify password
      const isPasswordValid = await bcryptUtil.comparePassword(password, user.password);

      if (!isPasswordValid) {
        const attempts = await UserModel.incrementFailedAttempts(user.id);
        const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
        const remainingAttempts = maxAttempts - attempts;

        if (remainingAttempts <= 0) {
          throw new ForbiddenError('Account locked due to multiple failed login attempts');
        }

        throw new UnauthorizedError(
          `Invalid credentials. ${remainingAttempts} attempt(s) remaining.`
        );
      }

      // Check if email is verified
      if (!user.is_verified) {
        throw new ForbiddenError('Please verify your email before logging in');
      }

      // Check if account is active
      if (!user.is_active) {
        throw new ForbiddenError('Account is deactivated');
      }

      // Update last login
      await UserModel.updateLastLogin(user.id);

      // Generate tokens
      const accessToken = jwtUtil.generateAccessToken({
        userId: user.id,
        email: user.email
      });

      const refreshToken = jwtUtil.generateRefreshToken({
        userId: user.id,
        email: user.email
      });

      // Store refresh token
      await this.storeRefreshToken(user.id, refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_verified: user.is_verified
        },
        accessToken,
        refreshToken,
        message: 'Login successful'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login with OTP (passwordless)
   * @param {string} email - User email
   * @returns {Promise<Object>} Result message
   */
  async requestLoginOTP(email) {
    try {
      const user = await UserModel.findByEmail(email);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!user.is_verified) {
        throw new ForbiddenError('Please verify your email first');
      }

      if (!user.is_active) {
        throw new ForbiddenError('Account is deactivated');
      }

      const otp = await OTPService.createOTP(user.id, 'login');
      await EmailService.sendLoginOTP(user.email, otp);

      return {
        message: 'Login OTP sent to your email'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify login OTP
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} Tokens and user data
   */
  async verifyLoginOTP(email, otp) {
    try {
      const user = await UserModel.findByEmail(email);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isValid = await OTPService.verifyOTP(user.id, otp, 'login');

      if (!isValid) {
        throw new UnauthorizedError('Invalid or expired OTP');
      }

      await UserModel.updateLastLogin(user.id);

      const accessToken = jwtUtil.generateAccessToken({
        userId: user.id,
        email: user.email
      });

      const refreshToken = jwtUtil.generateRefreshToken({
        userId: user.id,
        email: user.email
      });

      await this.storeRefreshToken(user.id, refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_verified: user.is_verified
        },
        accessToken,
        refreshToken,
        message: 'Login successful'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Result message
   */
  async requestPasswordReset(email) {
    try {
      const user = await UserModel.findByEmail(email);

      if (!user) {
        // Don't reveal if user exists
        return {
          message: 'If the email exists, a password reset OTP has been sent'
        };
      }

      const otp = await OTPService.createOTP(user.id, 'password_reset');
      await EmailService.sendPasswordResetOTP(user.email, otp);

      return {
        message: 'Password reset OTP sent to your email'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password using OTP
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result message
   */
  async resetPasswordWithOTP(email, otp, newPassword) {
    try {
      const user = await UserModel.findByEmail(email);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isValid = await OTPService.verifyOTP(user.id, otp, 'password_reset');

      if (!isValid) {
        throw new UnauthorizedError('Invalid or expired OTP');
      }

      await UserModel.updatePassword(user.id, newPassword);

      // Revoke all refresh tokens
      await this.revokeAllRefreshTokens(user.id);

      return {
        message: 'Password reset successful. Please login with your new password.'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwtUtil.verifyRefreshToken(refreshToken);

      // Check if refresh token exists and is not revoked
      const [rows] = await pool.query(
        `SELECT * FROM refresh_tokens 
         WHERE token = ? AND user_id = ? AND is_revoked = FALSE AND expires_at > NOW()`,
        [refreshToken, decoded.userId]
      );

      if (rows.length === 0) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      const user = await UserModel.findById(decoded.userId);

      if (!user || !user.is_active) {
        throw new UnauthorizedError('User not found or inactive');
      }

      const newAccessToken = jwtUtil.generateAccessToken({
        userId: user.id,
        email: user.email
      });

      return {
        accessToken: newAccessToken,
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   * @param {string} refreshToken - Refresh token to revoke
   * @returns {Promise<Object>} Result message
   */
  async logout(refreshToken) {
    try {
      await pool.query(
        `UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = ?`,
        [refreshToken]
      );

      return {
        message: 'Logout successful'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Store refresh token
   * @param {number} userId - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<void>}
   */
  async storeRefreshToken(userId, token) {
    try {
      const decoded = jwtUtil.decodeToken(token);
      const expiresAt = new Date(decoded.exp * 1000);

      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
        [userId, token, expiresAt]
      );
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async revokeAllRefreshTokens(userId) {
    try {
      await pool.query(
        `UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?`,
        [userId]
      );
    } catch (error) {
      console.error('Error revoking refresh tokens:', error);
      throw new Error('Failed to revoke refresh tokens');
    }
  }

  /**
   * Change password (authenticated user)
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result message
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get user with password
      const userWithPassword = await UserModel.findByEmail(user.email);

      // Verify current password
      const isPasswordValid = await bcryptUtil.comparePassword(
        currentPassword,
        userWithPassword.password
      );

      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      await UserModel.updatePassword(userId, newPassword);

      // Revoke all refresh tokens
      await this.revokeAllRefreshTokens(userId);

      return {
        message: 'Password changed successfully. Please login again.'
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
