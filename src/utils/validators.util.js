const { ValidationError } = require('./customError.util');

class ValidatorUtil {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} { isValid: boolean, message: string }
   */
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return {
        isValid: false,
        message: `Password must be at least ${minLength} characters long`
      };
    }

    if (!hasUpperCase) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter'
      };
    }

    if (!hasLowerCase) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter'
      };
    }

    if (!hasNumbers) {
      return {
        isValid: false,
        message: 'Password must contain at least one number'
      };
    }

    if (!hasSpecialChar) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character'
      };
    }

    return { isValid: true, message: 'Password is strong' };
  }

  /**
   * Sanitize input string
   * @param {string} input - String to sanitize
   * @returns {string}
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Validate OTP format
   * @param {string} otp - OTP to validate
   * @returns {boolean}
   */
  isValidOTP(otp) {
    const otpLength = parseInt(process.env.OTP_LENGTH) || 6;
    const otpRegex = new RegExp(`^\\d{${otpLength}}$`);
    return otpRegex.test(otp);
  }

  /**
   * Validate name format
   * @param {string} name - Name to validate
   * @returns {boolean}
   */
  isValidName(name) {
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
    return nameRegex.test(name);
  }
}

module.exports = new ValidatorUtil();
