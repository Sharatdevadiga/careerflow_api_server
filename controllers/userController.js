import asyncHandler from "../utils/asyncHandler.js";
import respondSuccess from "../utils/respondSuccess.js";
import SavedJobs from "../models/savedJobsModel.js";
import AppliedJobs from "../models/appliedJobsModel.js";
import Job from "../models/jobModel.js";

// Controller function to get the currently logged-in user data
const getLoggedInUser = asyncHandler(async function (req, res, next) {
  const user = req.user;
  respondSuccess(201, user, res);
});

// Controller function to get user statistics
const getUserStats = asyncHandler(async function (req, res, next) {
  const userId = req.user._id;
  const userType = req.user.type;

  let stats = {};

  if (userType === "employee") {
    // Get saved jobs count
    const savedJobs = await SavedJobs.findOne({ user: userId });
    const savedJobsCount = savedJobs?.jobs?.length || 0;

    // Get applied jobs count
    const appliedJobs = await AppliedJobs.findOne({ user: userId });
    const appliedJobsCount = appliedJobs?.jobs?.length || 0;

    stats = {
      savedJobs: savedJobsCount,
      appliedJobs: appliedJobsCount,
      profileViews: 0, // TODO: Implement profile views tracking
      interviews: 0, // TODO: Implement interviews tracking
    };
  } else if (userType === "employer") {
    // Get active jobs count posted by this employer
    const activeJobs = await Job.countDocuments({ employerId: userId });

    // Get total applicants across all jobs
    const employerJobs = await Job.find({ employerId: userId }).select("_id");
    const jobIds = employerJobs.map((job) => job._id);

    const applicantsCount = await AppliedJobs.aggregate([
      { $unwind: "$jobs" },
      { $match: { jobs: { $in: jobIds } } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    stats = {
      activeJobs: activeJobs,
      applicants: applicantsCount[0]?.count || 0,
      jobViews: 0, // TODO: Implement job views tracking
      hired: 0, // TODO: Implement hired tracking
    };
  }

  respondSuccess(200, stats, res);
});

// Exporting userController object containing the controller functions
const userController = {
  getLoggedInUser,
  getUserStats,
};
export default userController;
