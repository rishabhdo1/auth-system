const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },   // REQUIRED
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// // Initialize database tables
// const initializeDatabase = async () => {
//   try {
//     const connection = await pool.getConnection();

//     // Users table
//     await connection.query(`
//       CREATE TABLE IF NOT EXISTS users (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         email VARCHAR(255) UNIQUE NOT NULL,
//         password VARCHAR(255) NOT NULL,
//         first_name VARCHAR(100),
//         last_name VARCHAR(100),
//         is_verified BOOLEAN DEFAULT FALSE,
//         is_active BOOLEAN DEFAULT TRUE,
//         failed_login_attempts INT DEFAULT 0,
//         locked_until DATETIME NULL,
//         last_login DATETIME NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         INDEX idx_email (email),
//         INDEX idx_is_verified (is_verified),
//         INDEX idx_created_at (created_at)
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // OTP table
//     await connection.query(`
//       CREATE TABLE IF NOT EXISTS otps (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         user_id INT NOT NULL,
//         otp_code VARCHAR(10) NOT NULL,
//         otp_type ENUM('email_verification', 'password_reset', 'login') NOT NULL,
//         expires_at DATETIME NOT NULL,
//         is_used BOOLEAN DEFAULT FALSE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//         INDEX idx_user_id (user_id),
//         INDEX idx_otp_type (otp_type),
//         INDEX idx_expires_at (expires_at)
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Refresh tokens table
//     await connection.query(`
//       CREATE TABLE IF NOT EXISTS refresh_tokens (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         user_id INT NOT NULL,
//         token VARCHAR(500) NOT NULL,
//         expires_at DATETIME NOT NULL,
//         is_revoked BOOLEAN DEFAULT FALSE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//         INDEX idx_user_id (user_id),
//         INDEX idx_token (token(255))
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Password reset tokens table
//     await connection.query(`
//       CREATE TABLE IF NOT EXISTS password_reset_tokens (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         user_id INT NOT NULL,
//         token VARCHAR(500) NOT NULL,
//         expires_at DATETIME NOT NULL,
//         is_used BOOLEAN DEFAULT FALSE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//         INDEX idx_user_id (user_id),
//         INDEX idx_token (token(255))
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     console.log('✅ Database tables initialized successfully');
//     connection.release();
//   } catch (error) {
//     console.error('❌ Database initialization failed:', error.message);
//     throw error;
//   }
// };

module.exports = {
  pool,
  testConnection,
  // initializeDatabase
};
