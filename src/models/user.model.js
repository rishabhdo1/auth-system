const { pool } = require('../config/database');
const bcryptUtil = require('../utils/bcrypt.util');
const { NotFoundError, ConflictError } = require('../utils/customError.util');

class UserModel {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    const { email, password, first_name, last_name } = userData;

    try {
      // Check if user already exists
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcryptUtil.hashPassword(password);

      // Insert user
      const [result] = await pool.query(
        `INSERT INTO users (email, password, first_name, last_name) 
         VALUES (?, ?, ?, ?)`,
        [email, hashedPassword, first_name, last_name]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT id, email, first_name, last_name, is_verified, is_active, 
                last_login, created_at, updated_at 
         FROM users WHERE id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmail(email) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM users WHERE email = ?`,
        [email]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by email (without password)
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmailWithoutPassword(email) {
    try {
      const [rows] = await pool.query(
        `SELECT id, email, first_name, last_name, is_verified, is_active, 
                last_login, created_at, updated_at 
         FROM users WHERE email = ?`,
        [email]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      });

      values.push(id);

      await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.findById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Verify user email
   * @param {number} userId - User ID
   * @returns {Promise<boolean>}
   */
  async verifyEmail(userId) {
    try {
      await pool.query(
        `UPDATE users SET is_verified = TRUE WHERE id = ?`,
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw new Error('Failed to verify email');
    }
  }

  /**
   * Update password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>}
   */
  async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcryptUtil.hashPassword(newPassword);
      
      await pool.query(
        `UPDATE users SET password = ?, failed_login_attempts = 0, locked_until = NULL 
         WHERE id = ?`,
        [hashedPassword, userId]
      );

      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  }

  /**
   * Update last login
   * @param {number} userId - User ID
   * @returns {Promise<boolean>}
   */
  async updateLastLogin(userId) {
    try {
      await pool.query(
        `UPDATE users SET last_login = NOW(), failed_login_attempts = 0 WHERE id = ?`,
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Failed to update last login');
    }
  }

  /**
   * Increment failed login attempts
   * @param {number} userId - User ID
   * @returns {Promise<number>} Current failed attempts count
   */
  async incrementFailedAttempts(userId) {
    try {
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
      const lockTime = parseInt(process.env.LOCK_TIME) || 15; // minutes

      await pool.query(
        `UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?`,
        [userId]
      );

      const [rows] = await pool.query(
        `SELECT failed_login_attempts FROM users WHERE id = ?`,
        [userId]
      );

      const attempts = rows[0].failed_login_attempts;

      // Lock account if max attempts reached
      if (attempts >= maxAttempts) {
        await pool.query(
          `UPDATE users SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?`,
          [lockTime, userId]
        );
      }

      return attempts;
    } catch (error) {
      console.error('Error incrementing failed attempts:', error);
      throw new Error('Failed to increment failed attempts');
    }
  }

  /**
   * Check if account is locked
   * @param {number} userId - User ID
   * @returns {Promise<Object>} { isLocked: boolean, lockedUntil: Date|null }
   */
  async isAccountLocked(userId) {
    try {
      const [rows] = await pool.query(
        `SELECT locked_until FROM users WHERE id = ?`,
        [userId]
      );

      if (rows.length === 0) {
        return { isLocked: false, lockedUntil: null };
      }

      const lockedUntil = rows[0].locked_until;

      if (!lockedUntil) {
        return { isLocked: false, lockedUntil: null };
      }

      const isLocked = new Date(lockedUntil) > new Date();

      // If lock period has expired, reset the lock
      if (!isLocked) {
        await pool.query(
          `UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?`,
          [userId]
        );
      }

      return { isLocked, lockedUntil: isLocked ? lockedUntil : null };
    } catch (error) {
      console.error('Error checking account lock:', error);
      throw new Error('Failed to check account lock');
    }
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      await pool.query(`DELETE FROM users WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
}

module.exports = new UserModel();
