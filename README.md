# Production-Level Authentication System

A complete, production-ready authentication system built with Node.js, Express, and MySQL featuring multiple authentication methods, OTP verification, and comprehensive security features.

## 🚀 Features

### Authentication Methods
- **Email & Password Login** - Traditional authentication with password hashing
- **OTP-based Login** - Passwordless authentication via email OTP
- **Email Verification** - Account verification using OTP
- **Password Reset** - Secure password recovery with OTP

### Security Features
- ✅ Password hashing with bcrypt (configurable rounds)
- ✅ JWT-based authentication (access & refresh tokens)
- ✅ HTTP-only cookies for refresh tokens
- ✅ Account locking after failed login attempts
- ✅ Rate limiting on all routes
- ✅ Helmet.js for security headers
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection

### Production Features
- 📧 Email service with beautiful HTML templates
- 🔐 OTP generation and management
- 🗄️ MySQL with connection pooling
- ⚡ Async/await error handling
- 📝 Request logging with Morgan
- 🎯 Structured error responses
- 🔄 Token refresh mechanism
- 🚦 Health check endpoint

## 📁 Project Structure

```
auth-system/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration & initialization
│   ├── controllers/
│   │   └── auth.controller.js   # Request handlers
│   ├── middlewares/
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── errorHandler.middleware.js
│   │   └── validation.middleware.js
│   ├── models/
│   │   └── user.model.js        # User database operations
│   ├── routes/
│   │   └── auth.routes.js       # API routes
│   ├── services/
│   │   ├── auth.service.js      # Business logic
│   │   ├── email.service.js     # Email operations
│   │   └── otp.service.js       # OTP management
│   ├── utils/
│   │   ├── bcrypt.util.js       # Password hashing
│   │   ├── jwt.util.js          # Token operations
│   │   ├── validators.util.js   # Validation helpers
│   │   └── customError.util.js  # Error classes
│   ├── validators/
│   │   └── auth.validator.js    # Request validation
│   └── app.js                   # Application entry point
├── .env.example                 # Environment variables template
└── package.json
```

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Setup Steps

1. **Clone or create the project directory**
```bash
mkdir auth-system && cd auth-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=auth_system
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key
JWT_REFRESH_EXPIRE=30d

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourapp.com

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=15

# Frontend
FRONTEND_URL=http://localhost:3000
```

4. **Create MySQL database**
```sql
CREATE DATABASE auth_system;
```

The tables will be automatically created when you start the server.

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/auth
```

### Endpoints

#### 1. **Register New User**
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_verified": false
  },
  "message": "Registration successful. Please check your email for verification OTP."
}
```

---

#### 2. **Verify Email**
```http
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Email verified successfully. You can now login."
}
```

---

#### 3. **Resend Verification OTP**
```http
POST /api/auth/resend-verification
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

#### 4. **Login with Password**
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_verified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Note:** Refresh token is set in HTTP-only cookie

---

#### 5. **Request Login OTP (Passwordless)**
```http
POST /api/auth/login/otp/request
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

#### 6. **Verify Login OTP**
```http
POST /api/auth/login/otp/verify
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response:** Same as regular login

---

#### 7. **Request Password Reset**
```http
POST /api/auth/password/reset/request
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

#### 8. **Reset Password with OTP**
```http
POST /api/auth/password/reset/verify
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123!"
}
```

---

#### 9. **Change Password (Authenticated)**
```http
POST /api/auth/password/change
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

---

#### 10. **Refresh Access Token**
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Or automatically uses refresh token from HTTP-only cookie

---

#### 11. **Logout**
```http
POST /api/auth/logout
```

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 12. **Get Current User**
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_verified": true
    }
  }
}
```

---

## 🔐 Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*(),.?":{}|<>)

## 🔒 Security Features Explained

### 1. **Account Locking**
- After 5 failed login attempts, account is locked for 15 minutes
- Configurable via `MAX_LOGIN_ATTEMPTS` and `LOCK_TIME` env variables

### 2. **OTP Expiration**
- OTPs expire after 10 minutes (configurable)
- Old OTPs are automatically invalidated when new ones are generated

### 3. **Token Management**
- Access tokens expire in 7 days (configurable)
- Refresh tokens expire in 30 days (configurable)
- Refresh tokens are revoked on password change

### 4. **Rate Limiting**
- General API: 100 requests per 15 minutes
- Auth routes: 20 requests per 15 minutes

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASSWORD`

### Email Templates
The system includes beautiful HTML email templates for:
- Email verification
- Password reset
- Login OTP
- Password reset OTP

## 🧪 Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🗄️ Database Schema

### Users Table
```sql
- id (INT, PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- password (VARCHAR)
- first_name (VARCHAR)
- last_name (VARCHAR)
- is_verified (BOOLEAN)
- is_active (BOOLEAN)
- failed_login_attempts (INT)
- locked_until (DATETIME)
- last_login (DATETIME)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### OTPs Table
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- otp_code (VARCHAR)
- otp_type (ENUM: 'email_verification', 'password_reset', 'login')
- expires_at (DATETIME)
- is_used (BOOLEAN)
- created_at (TIMESTAMP)
```

### Refresh Tokens Table
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- token (VARCHAR)
- expires_at (DATETIME)
- is_revoked (BOOLEAN)
- created_at (TIMESTAMP)
```

## 🚀 Production Deployment

### Environment Variables
Set all environment variables in your hosting platform

### Database
- Use connection pooling
- Set up database backups
- Use environment-specific credentials

### Security Checklist
- [ ] Change all default secrets
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Enable logging
- [ ] Set up monitoring
- [ ] Configure email service
- [ ] Test rate limiting
- [ ] Review security headers

## 🔧 Customization

### Modify OTP Length
```env
OTP_LENGTH=6
```

### Adjust Token Expiration
```env
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
```

### Configure Account Locking
```env
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=15
```

## 📝 Error Responses

All errors follow this format:
```json
{
  "status": "fail" | "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```
