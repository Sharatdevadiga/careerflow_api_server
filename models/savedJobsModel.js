import mongoose from "mongoose";

// Schema for saved jobs
const savedJobsSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  jobs: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Job",
    },
  ],
});

// Model for saved jobs
const SavedJobs = mongoose.model("SavedJobs", savedJobsSchema);
export default SavedJobs;
