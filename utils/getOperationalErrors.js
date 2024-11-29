/*
  The 'getOperationalErrors' function categorizes known operational 
  errors, providing user-friendly messages while allowing for 
  specific handling of various error types (e.g., CastError, 
  ValidationError, JWT errors).
*/

// Identifying operational errors
export default function getOperationalErrors(err) {
  // Handle invalid "id" field for MongoDB queries
  if (err.name === "CastError") {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Handle duplicate email errors from MongoDB
  if (err.code === 11000) {
    return new AppError(
      `Duplicate field : ${err.keyValue.email}. Please use another value`,
      400
    );
  }

  // Handle validation errors from MongoDB
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((error) => error.message)
      .join(". ");
    return new AppError(`Invalid input data: ${message}`, 401);
  }

  // Handle JWT verification errors
  if (err.name === "JsonWebTokenError") {
    return new AppError("Invalid token please login again.", 401);
  }

  // Handle token expiration errors
  if (err.name === "TokenExpiredError") {
    return new AppError("Your token has expired. Please login again");
  }

  return err;
}
