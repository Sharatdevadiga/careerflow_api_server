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
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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

function restrictTo(userType) {
  return function (req, res, next) {
    if (userType !== req.user.type) {
      return next(new AppError("You are not authorised for this action", 403));
    }
    next();
  };
}

/*


*/

// Export the authController with signUp, login, logout, protect, and optionalAuth functions
const authController = {
  signUp,
  login,
  logout,
  protect,
  optionalAuth,
  restrictTo,
};

export default authController;
