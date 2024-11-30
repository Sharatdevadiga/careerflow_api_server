import express from "express";
import cookieParser from "cookie-parser";
import ExpressMongoSanitize from "express-mongo-sanitize";
import cors from "cors";
import compression from "compression";
import userRouter from "./routers/userRouter.js";
import jobRouter from "./routers/jobRouter.js";
import savedJobRouter from "./routers/savedJobRouter.js";
import appliedJobRouter from "./routers/appliedJobRouter.js";

import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errorController.js";
import dotenv from "dotenv";
import morgan from "morgan";

// Load environment variables from .env file
dotenv.config();

// Creating an Express application instance
const app = express();

// Use morgan middleware for logging
// 'dev' format outputs concise colored logs with response time and status
app.use(morgan("dev"));

// Global Middlewares
app.use(express.json()); // for parsing JSON payloads
app.use(cookieParser()); // for parsing cookies from client

// CORS configuration to allow requests only from specified origin
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true, // Allow credentials (cookies, headers)
  })
);
app.use(compression()); // for compressing the API responses
app.use(ExpressMongoSanitize()); // for prevention of noSql query injection

// Mounting Routers for handling API routes
app.use("/api/v1/user", userRouter); // Routes for user-related actions
app.use("/api/v1/job", jobRouter); // Routes for job related actions
app.use("/api/v1/savedjobs", savedJobRouter); // Routes for saved jobs
app.use("/api/v1/appliedjobs", appliedJobRouter); // Routes for applied jobs

app.use("/", (req, res) => {
  res.send("Welcome to the Naukri Clone API 😊 : @Sharath");
})

// Route handler for undefined routes (404 Not Found)
app.use("*", (req, res, next) => {
  next(new AppError("Cannot find this route on this server", 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

export default app;
