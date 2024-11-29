import User from "../models/userModel.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { users } from "./Data/userData.js";

dotenv.config();
const DATABASE = process.env.DATABASE;
if (!DATABASE) {
  console.error("DATABASE environment variable is not defined");
  process.exit(1);
}

//TODO: Remeber to set this propery in user schmea before importing userdata
//_id: Number  <-- overwrite Mongoose's default `_id`

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
// First connect to the database, then import data
(async function () {
  await connectToDatabase();
})();

// Import data into Database
async function importData() {
  try {
    for (let user of users) {
      await User.create(user);
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
    await User.deleteMany();

    console.log("Delete successful");
  } catch (err) {
    console.log(err);
  }
  process.exit();
}

// Setting commands for importing and deleting
/* COMMANDS
  cd dev-data/
  node importUserData --import /// For importing the data to DB
  node importUserData --delete /// For deleting the data from DB
*/
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
