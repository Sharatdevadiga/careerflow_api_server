import mongoose from "mongoose";

// Schema for applied jobs
const appliedJobsSchema = mongoose.Schema({
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

// Model for applied jobs
const AppliedJobs = mongoose.model("AppliedModel", appliedJobsSchema);
export default AppliedJobs;
