import getOperationalErrors from "../utils/getOperationalErrors.js";

// Middleware function to handle errors globally throughout the application
function globalErrorHandler(err, req, res, next) {
  // Setting default status code and status message if not provided
  err.statusCode = err.statusCode || 500; // Default status code
  err.status = err.status || "error"; // Default status
  console.log('Error details:', err);

  // Determine the environment and send appropriate error response
  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    sendErrorForProd(err, req, res);
  }
}

// ------------------ HELPER FUNCTIONS ----------------------------

// For Development => send complete error details
/*
  In development mode, we provide complete details about the error,
  including the error object and stack trace to help with debugging.
*/
function sendErrorForDev(err, req, res) {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
    error: err,
    stack: err.stack,
  });
}

// For Production => send only status and message
/*
  In production mode, we send limited information to the client,
  focusing on user-friendly messages while avoiding leaking sensitive details. 
*/
function sendErrorForProd(err, req, res) {
  // Identifying operational errors
  const error = getOperationalErrors(err);

  // If error is operational, then send error details
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  // If error is programattic, then send generic message
  return res.status(500).json({
    status: "error",
    message: "something went wrong",
  });
}

export default globalErrorHandler;
