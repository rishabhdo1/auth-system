const { pool } = require('../config/database');
const crypto = require('crypto');

class OTPService {
  constructor() {
    this.otpLength = parseInt(process.env.OTP_LENGTH) || 6;
    this.otpExpireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;
  }

  /**
   * Generate random OTP
   * @returns {string} OTP code
   */
  generateOTP() {
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    return crypto.randomInt(min, max).toString();
  }

  /**
   * Create and store OTP
   * @param {number} userId - User ID
   * @param {string} otpType - Type of OTP (email_verification, password_reset, login)
   * @returns {Promise<string>} OTP code
   */
  async createOTP(userId, otpType) {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.otpExpireMinutes * 60 * 1000);

      // Invalidate any existing unused OTPs for this user and type
      await pool.query(
        `UPDATE otps 
         SET is_used = TRUE 
         WHERE user_id = ? AND otp_type = ? AND is_used = FALSE`,
        [userId, otpType]
      );

      // Insert new OTP
      await pool.query(
        `INSERT INTO otps (user_id, otp_code, otp_type, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [userId, otp, otpType, expiresAt]
      );

      return otp;
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw new Error('Failed to create OTP');
    }
  }

  /**
   * Verify OTP
   * @param {number} userId - User ID
   * @param {string} otpCode - OTP code to verify
   * @param {string} otpType - Type of OTP
   * @returns {Promise<boolean>} Verification result
   */
  async verifyOTP(userId, otpCode, otpType) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM otps 
         WHERE user_id = ? 
         AND otp_code = ? 
         AND otp_type = ? 
         AND is_used = FALSE 
         AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, otpCode, otpType]
      );

      if (rows.length === 0) {
        return false;
      }

      // Mark OTP as used
      await pool.query(
        `UPDATE otps SET is_used = TRUE WHERE id = ?`,
        [rows[0].id]
      );

      return true;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Failed to verify OTP');
    }
  }

  /**
   * Clean up expired OTPs (should be run periodically)
   * @returns {Promise<number>} Number of deleted OTPs
   */
  async cleanupExpiredOTPs() {
    try {
      const [result] = await pool.query(
        `DELETE FROM otps WHERE expires_at < NOW()`
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      throw new Error('Failed to cleanup expired OTPs');
    }
  }

  /**
   * Get remaining OTP attempts
   * @param {number} userId - User ID
   * @param {string} otpType - Type of OTP
   * @returns {Promise<number>} Number of remaining attempts
   */
  async getRemainingAttempts(userId, otpType) {
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(*) as count FROM otps 
         WHERE user_id = ? 
         AND otp_type = ? 
         AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
        [userId, otpType]
      );

      const maxAttempts = 5;
      return Math.max(0, maxAttempts - rows[0].count);
    } catch (error) {
      console.error('Error getting remaining attempts:', error);
      throw new Error('Failed to get remaining attempts');
    }
  }
}

module.exports = new OTPService();
