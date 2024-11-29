import mongoose from "mongoose";
import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

// Getting required environment variables
const db = process.env.DATABASE;
const port = process.env.PORT || 3000;

// Handling uncaught exceptions globally
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION!!! 💥💥 Shutting Down....");
  console.log(err);
  // End the app
  process.exit();
});

// Connecting to Mongodb Atlas database
mongoose.connect(db).then(() => console.log("Database connection successful"));

// starting a server
const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// Handling global unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED PROMISE REJECTION!! 💥💥 Shutting down....");
  console.log(err);

  // Close the server and end the app
  server.close(() => {
    process.exit();
  });
});
