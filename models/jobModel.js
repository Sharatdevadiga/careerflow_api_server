import mongoose, { Mongoose } from "mongoose";
import formatDate from "../utils/formatDate.js";

// Schema for jobs
const jobsSchema = mongoose.Schema({
  role: {
    type: "string",
    required: [true, "Job must have a role"],
    index: true,
  },

  company: {
    type: "string",
    required: [true, "Job must belong to a company"],
  },

  date: {
    type: Date,
    default: formatDate(new Date()),
  },

  locations: {
    type: [String],
    required: [true, "AN array of locations is required"],
  },

  description: {
    type: String,
    minLength: 200,
    maxLength: 500,
    required: [true, "A job must have a description"],
  },

  remote: {
    type: Boolean,
    default: false,
  },

  employerId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

// Indexing the schema
jobsSchema.index({ employerId: 1, date: 1, role: 1 }, { unique: true });

// Model for jobs
const Job = mongoose.model("Job", jobsSchema);
export default Job;
