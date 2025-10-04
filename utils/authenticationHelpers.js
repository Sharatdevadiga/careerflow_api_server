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

// Helper function to sign a JWT token
export function createSendToken(user, statusCode, res) {
  const token = signJWT(user._id);

  // Set the JWT token in a secure cookie
  const cookieOptions = {
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: NODE_ENV === "production",
  };
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  // Send a success response with the user data and JWT token
  respondSuccess(statusCode, user, res, { token });
}
