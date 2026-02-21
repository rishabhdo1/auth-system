const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Send verification email
   * @param {string} to - Recipient email
   * @param {string} otp - OTP code
   * @returns {Promise}
   */
  async sendVerificationEmail(to, otp) {
    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Email Verification - OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .otp-box { background: white; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #4CAF50; border: 2px dashed #4CAF50; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { color: #f44336; font-size: 14px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>Thank you for registering with us. Please use the following OTP to verify your email address:</p>
              <div class="otp-box">${otp}</div>
              <p>This OTP will expire in <strong>${process.env.OTP_EXPIRE_MINUTES || 10} minutes</strong>.</p>
              <p class="warning">⚠️ If you didn't request this verification, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Auth System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email
   * @param {string} resetToken - Password reset token
   * @returns {Promise}
   */
  async sendPasswordResetEmail(to, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 30px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { color: #f44336; font-size: 14px; margin-top: 15px; }
            .link { word-break: break-all; color: #2196F3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p class="link">${resetUrl}</p>
              <p>This link will expire in <strong>1 hour</strong>.</p>
              <p class="warning">⚠️ If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Auth System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send OTP for login
   * @param {string} to - Recipient email
   * @param {string} otp - OTP code
   * @returns {Promise}
   */
  async sendLoginOTP(to, otp) {
    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Login Verification - OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .otp-box { background: white; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #FF9800; border: 2px dashed #FF9800; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { color: #f44336; font-size: 14px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Login Verification</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>Someone is trying to log in to your account. Please use the following OTP to proceed:</p>
              <div class="otp-box">${otp}</div>
              <p>This OTP will expire in <strong>${process.env.OTP_EXPIRE_MINUTES || 10} minutes</strong>.</p>
              <p class="warning">⚠️ If you didn't attempt to log in, please secure your account immediately.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Auth System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Login OTP email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending login OTP email:', error);
      throw new Error('Failed to send login OTP email');
    }
  }

  /**
   * Send password reset OTP
   * @param {string} to - Recipient email
   * @param {string} otp - OTP code
   * @returns {Promise}
   */
  async sendPasswordResetOTP(to, otp) {
    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Password Reset - OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #9C27B0; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .otp-box { background: white; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #9C27B0; border: 2px dashed #9C27B0; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { color: #f44336; font-size: 14px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset OTP</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>You requested to reset your password. Please use the following OTP:</p>
              <div class="otp-box">${otp}</div>
              <p>This OTP will expire in <strong>${process.env.OTP_EXPIRE_MINUTES || 10} minutes</strong>.</p>
              <p class="warning">⚠️ If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Auth System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset OTP email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending password reset OTP email:', error);
      throw new Error('Failed to send password reset OTP email');
    }
  }
}

module.exports = new EmailService();
