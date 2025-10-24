import respondSuccess from "./respondSuccess.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// Load environment variables from the .env file
dotenv.config();
const { JWT_EXPIRES_IN, JWT_COOKIE_EXPIRES_IN, JWT_SECRET, NODE_ENV } =
  process.env;

// Helper function to sign a JWT token with the user's id
export function signJWT(id) {
  const token = jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return token;
}

// Helper function to sign a JWT token and send it in httpOnly cookie
export function createSendToken(user, statusCode, res) {
  const token = signJWT(user._id);

  // Set the JWT token in a secure httpOnly cookie
  const cookieOptions = {
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true, // Prevents JavaScript access to the cookie
    sameSite: NODE_ENV === "production" ? "none" : "lax", // CSRF protection
    secure: NODE_ENV === "production", // Only send cookie over HTTPS in production
    path: "/", // Cookie available for all routes
  };
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  // Send a success response with the user data (NO TOKEN in response body)
  respondSuccess(statusCode, user, res);
}
