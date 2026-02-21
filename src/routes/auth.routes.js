const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const authMiddleware = require('../middlewares/auth.middleware');

// Public routes
router.post(
  '/register',
  authValidator.registerRules(),
  authValidator.validate,
  authController.register
);

router.post(
  '/verify-email',
  authValidator.verifyEmailRules(),
  authValidator.validate,
  authController.verifyEmail
);

router.post(
  '/resend-verification',
  authValidator.emailRules(),
  authValidator.validate,
  authController.resendVerificationOTP
);

router.post(
  '/login',
  authValidator.loginRules(),
  authValidator.validate,
  authController.login
);

// Passwordless login with OTP
router.post(
  '/login/otp/request',
  authValidator.emailRules(),
  authValidator.validate,
  authController.requestLoginOTP
);

router.post(
  '/login/otp/verify',
  authValidator.verifyEmailRules(),
  authValidator.validate,
  authController.verifyLoginOTP
);

// Password reset
router.post(
  '/password/reset/request',
  authValidator.emailRules(),
  authValidator.validate,
  authController.requestPasswordReset
);

router.post(
  '/password/reset/verify',
  authValidator.resetPasswordRules(),
  authValidator.validate,
  authController.resetPasswordWithOTP
);

// Token refresh
router.post(
  '/refresh',
  authController.refreshToken
);

// Logout
router.post(
  '/logout',
  authController.logout
);

// Protected routes (require authentication)
router.get(
  '/me',
  authMiddleware.authenticate.bind(authMiddleware),
  authController.getCurrentUser
);

router.post(
  '/password/change',
  authMiddleware.authenticate.bind(authMiddleware),
  authValidator.changePasswordRules(),
  authValidator.validate,
  authController.changePassword
);

module.exports = router;
