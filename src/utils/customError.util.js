class CustomError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends CustomError {
  constructor(message, errors = null) {
    super(message, 400, errors);
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

class ForbiddenError extends CustomError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

class NotFoundError extends CustomError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends CustomError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

class TooManyRequestsError extends CustomError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

class InternalServerError extends CustomError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

module.exports = {
  CustomError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError
};
