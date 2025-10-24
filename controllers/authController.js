import asyncHandler from "../utils/asyncHandler.js";
import { createSendToken } from "../utils/authenticationHelpers.js";

import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import respondSuccess from "../utils/respondSuccess.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import savedJobController from "./savedJobController.js";
import appliedJobController from "./appliedJobController.js";

// Load environment variables from the .env file
dotenv.config();
const { JWT_SECRET } = process.env;
/*


*/

// SignUp function to handle user registration
const signUp = asyncHandler(async function (req, res, next) {
  const { 
    email, 
    password, 
    passwordConfirm, 
    type, 
    role, 
    firstName, 
    lastName, 
    company 
  } = req.body;

  if (!email || !password || !passwordConfirm) {
    return next(
      new AppError("Please provide email, password and passwordConfirm", 400)
    );
  }

  // Map role to type if role is provided (for frontend compatibility)
  const userType = type || role;
  
  // Check required fields for all users
  if (!firstName || !lastName) {
    return next(
      new AppError("Please provide firstName and lastName", 400)
    );
  }
  
  // For employer accounts, check company field
  if (userType === "employer" && !company) {
    return next(
      new AppError("Please provide company name for employers", 400)
    );
  }

  // Create user data object
  const userData = {
    email,
    password,
    passwordConfirm,
    type: userType,
  };

  // Add fields based on user type
  if (userType === "employee") {
    userData.firstName = firstName;
    userData.lastName = lastName;
  } else if (userType === "employer") {
    userData.company = company;
    userData.firstName = firstName;
    userData.lastName = lastName;
  }

  // Create a new user and bookmark for that user, in the database
  const newUser = await User.create(userData);

  if (newUser.type === "employee") {
    const newSavedJobs = await savedJobController.createSavedJobs(
      newUser._id,
      next
    );

    const newAppliedJobs = await appliedJobController.createAppliedJobs(
      newUser._id,
      next
    );

    await User.findByIdAndUpdate(newUser._id, {
      savedJobsId: newSavedJobs._id,
      appliedJobsId: newAppliedJobs._id,
    });
  }

  // Send the response with the newly created user and JWT token
  createSendToken(newUser, 201, res);
});

/*


*/

// Login function to authenticate a user
const login = asyncHandler(async function (req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide both email and password.", 400));
  }

  // Find the user by email and include the password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("User does not exist. Please signup first.", 401));
  }
  // Check if the provided password matches the stored password
  if (!(await user.checkPassword(password, user.password))) {
    return next(new AppError("Incorrect password. Please try again", 401));
  }
  // Send the response with the authenticated user and JWT token
  createSendToken(user, 200, res);
});

/*


*/

// Logout function to clear the user's JWT cookie
const logout = asyncHandler(async function (req, res, next) {
  res.clearCookie("jwt");
  respondSuccess(200, { message: "Logged out successfully" }, res);
});

/*


*/

// Protect function to verify JWT token and secure access to protected routes
const protect = asyncHandler(async function (req, res, next) {
  let token;
  
  // Prioritize cookie over Authorization header (for httpOnly cookie implementation)
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please login to get access.", 401)
    );
  }

  // Decode the user from token
  const decoded = jwt.verify(token, JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("User does not exist.", 404));
  }

  // Attach the currentUser to the request object for use in subsequent middleware
  req.user = currentUser;
  next();
});

// Optional auth - attaches user if authenticated but doesn't block if not
const optionalAuth = asyncHandler(async function (req, res, next) {
  let token;
  
  // Prioritize cookie over Authorization header
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token, just continue without user
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Decode the user from token
    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    
    // Attach user if found, otherwise set to null
    req.user = currentUser || null;
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
  }
  
  next();
});

/*


*/

// RestrictTo middleware - accepts multiple roles
// Usage: restrictTo('employer'), restrictTo('employee'), or restrictTo('admin', 'employer')
function restrictTo(...allowedRoles) {
  return function (req, res, next) {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return next(
        new AppError("You must be logged in to access this resource", 401)
      );
    }

    // Check if user's type/role is in the allowed roles
    if (!allowedRoles.includes(req.user.type)) {
      return next(
        new AppError(
          `Access denied. This resource is only available to ${allowedRoles.join(', ')} users.`,
          403
        )
      );
    }
    
    next();
  };
}

/*


*/

// Change password function - requires authentication
const changePassword = asyncHandler(async function (req, res, next) {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  console.log('Password change request:', { currentPassword: '***', newPassword: '***', newPasswordConfirm: '***' });

  // Validate input fields
  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return next(
      new AppError("Please provide current password, new password, and confirmation", 400)
    );
  }

  // Check if new password and confirmation match
  if (newPassword !== newPasswordConfirm) {
    return next(new AppError("New password and confirmation do not match", 400));
  }

  // Password length validation
  if (newPassword.length < 8 || newPassword.length > 15) {
    return next(new AppError("New password must be between 8 and 15 characters long", 400));
  }

  // Get user from database with password field
  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  console.log('Found user, checking current password...');
  console.log('User ID:', user._id);
  console.log('User email:', user.email);
  console.log('Stored password hash:', user.password);
  console.log('Input current password:', currentPassword);

  // Verify current password
  const isCurrentPasswordCorrect = await user.checkPassword(currentPassword, user.password);
  console.log('Current password check result:', isCurrentPasswordCorrect);
  
  if (!isCurrentPasswordCorrect) {
    return next(new AppError("Current password is incorrect", 401));
  }

  console.log('Current password verified, updating to new password...');

  // Update password (pre-save middleware will hash it)
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  
  try {
    await user.save();
    console.log('Password updated successfully');
    
    // Send success response (don't send new token, just confirmation)
    respondSuccess(200, {
      message: "Password updated successfully"
    }, res);
  } catch (error) {
    console.error('Error saving user:', error);
    return next(new AppError("Failed to update password", 500));
  }
});

// Export the authController with signUp, login, logout, protect, optionalAuth, and changePassword functions
const authController = {
  signUp,
  login,
  logout,
  protect,
  optionalAuth,
  restrictTo,
  changePassword,
};

export default authController;
