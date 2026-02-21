const AuthService = require('../services/auth.service');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);

    res.status(201).json({
      status: 'success',
      data: result.user,
      message: result.message
    });
  });

  /**
   * Verify email with OTP
   * POST /api/auth/verify-email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const result = await AuthService.verifyEmail(email, otp);

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  });

  /**
   * Resend verification OTP
   * POST /api/auth/resend-verification
   */
  resendVerificationOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await AuthService.resendVerificationOTP(email);

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  });

  /**
   * Login with email and password
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        accessToken: result.accessToken
      },
      message: result.message
    });
  });

  /**
   * Request login OTP (passwordless login)
   * POST /api/auth/login/otp/request
   */
  requestLoginOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await AuthService.requestLoginOTP(email);

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  });

  /**
   * Verify login OTP
   * POST /api/auth/login/otp/verify
   */
  verifyLoginOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const result = await AuthService.verifyLoginOTP(email, otp);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        accessToken: result.accessToken
      },
      message: result.message
    });
  });

  /**
   * Request password reset OTP
   * POST /api/auth/password/reset/request
   */
  requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await AuthService.requestPasswordReset(email);

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  });

  /**
   * Reset password with OTP
   * POST /api/auth/password/reset/verify
   */
  resetPasswordWithOTP = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const result = await AuthService.resetPasswordWithOTP(email, otp, newPassword);

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  });

  /**
   * Change password (authenticated)
   * POST /api/auth/password/change
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = asyncHandler(async (req, res) => {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        status: 'fail',
        message: 'Refresh token is required'
      });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: result.accessToken
      },
      message: result.message
    });
  });

  /**
   * Logout
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  });

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  });
}

module.exports = new AuthController();
