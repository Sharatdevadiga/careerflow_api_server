class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;

    // Determine the status of the error based on the status code
    // If it starts with '4', it's a client error (fail); otherwise, it's a server error (error)
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Flag to indicate that this error is operational and expected
    this.isOperational = true;

    // Capture the stack trace for better debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
