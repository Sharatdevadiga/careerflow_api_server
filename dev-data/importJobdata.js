import Job from "../models/jobModel.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { jobsData } from "./Data/jobData.js";

dotenv.config();
const DATABASE = process.env.DATABASE;
if (!DATABASE) {
  console.error("DATABASE environment variable is not defined");
  process.exit(1);
}

// Connecting to Mongodb Atlas database
async function connectToDatabase() {
  try {
    await mongoose.connect(DATABASE);
    console.log("Database connection successful");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

// Import data into Database
async function importData() {
  try {
    for (let job of jobsData) {
      await Job.create(job);
    }

    console.log("data successfully loaded");
  } catch (err) {
    console.log(err);
  }
  process.exit();
}

// Delete all the data in the collection
async function deleteData() {
  try {
    await Job.deleteMany();

    console.log("Delete successful");
  } catch (err) {
    console.log(err);
  }
  process.exit();
}

// Setting commands for importing and deleting
/* COMMANDS
  cd dev-data/
  node importJobData --import /// For importing the data to DB
  node importJobData --delete /// For deleting the data from DB
*/

// First connect to the database, then import data
(async function () {
  await connectToDatabase();
  if (process.argv[2] === "--import") {
    await importData();
  } else if (process.argv[2] === "--delete") {
    await deleteData();
  }
})();
