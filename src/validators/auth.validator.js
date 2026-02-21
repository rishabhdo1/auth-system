const { body, validationResult } = require('express-validator');
const validatorUtil = require('../utils/validators.util');

class AuthValidator {
  /**
   * Validation middleware handler
   */
  validate(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    
    next();
  }

  /**
   * Register validation rules
   */
  registerRules() {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .custom((value) => {
          const validation = validatorUtil.validatePasswordStrength(value);
          if (!validation.isValid) {
            throw new Error(validation.message);
          }
          return true;
        }),
      
      body('first_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
      
      body('last_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes')
    ];
  }

  /**
   * Login validation rules
   */
  loginRules() {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ];
  }

  /**
   * Email validation rules
   */
  emailRules() {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
    ];
  }

  /**
   * Verify email validation rules
   */
  verifyEmailRules() {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
      
      body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .custom((value) => {
          if (!validatorUtil.isValidOTP(value)) {
            throw new Error(`OTP must be ${process.env.OTP_LENGTH || 6} digits`);
          }
          return true;
        })
    ];
  }

  /**
   * Reset password validation rules
   */
  resetPasswordRules() {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
      
      body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .custom((value) => {
          if (!validatorUtil.isValidOTP(value)) {
            throw new Error(`OTP must be ${process.env.OTP_LENGTH || 6} digits`);
          }
          return true;
        }),
      
      body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .custom((value) => {
          const validation = validatorUtil.validatePasswordStrength(value);
          if (!validation.isValid) {
            throw new Error(validation.message);
          }
          return true;
        })
    ];
  }

  /**
   * Change password validation rules
   */
  changePasswordRules() {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
      
      body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .custom((value, { req }) => {
          if (value === req.body.currentPassword) {
            throw new Error('New password must be different from current password');
          }
          const validation = validatorUtil.validatePasswordStrength(value);
          if (!validation.isValid) {
            throw new Error(validation.message);
          }
          return true;
        }),
      
      body('confirmPassword')
        .notEmpty()
        .withMessage('Please confirm your new password')
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
          }
          return true;
        })
    ];
  }

  /**
   * Refresh token validation rules
   */
  refreshTokenRules() {
    return [
      body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required')
    ];
  }
}

module.exports = new AuthValidator();
