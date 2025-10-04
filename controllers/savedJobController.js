import SavedJobs from "../models/savedJobsModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import respondSuccess from "../utils/respondSuccess.js";
import Job from "../models/jobModel.js";
import AppError from "../utils/appError.js";

//function to create a new savedJobs list for a user
async function createSavedJobs(userId, next) {
  try {
    const newSavedJobs = await SavedJobs.create({ user: userId });

    return newSavedJobs;
  } catch (err) {
    next(err);
  }
} 

// function to get all the saved jobs for a user
const getSavedJobs = asyncHandler(async function (req, res, next) {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Get the user's saved jobs document
  const savedJobsDoc = await SavedJobs.findOne({ user: req.user._id });

  // Handle case when user has no saved jobs document yet
  if (!savedJobsDoc || !savedJobsDoc.jobs || savedJobsDoc.jobs.length === 0) {
    return respondSuccess(200, [], res, {
      results: 0,
      page: parseInt(page),
      totalPages: 0,
      total: 0
    });
  }

  // Get total count of saved jobs
  const totalSavedJobs = savedJobsDoc.jobs.length;
  const totalPages = Math.ceil(totalSavedJobs / limit);

  // Get paginated jobs
  const savedJobsWithPagination = await SavedJobs.findOne({ user: req.user._id })
    .select('jobs')
    .slice('jobs', [skip, parseInt(limit)])
    .populate('jobs');

  const jobs = savedJobsWithPagination?.jobs || [];

  respondSuccess(200, jobs, res, {
    results: jobs.length,
    page: parseInt(page),
    totalPages,
    total: totalSavedJobs
  });
});

// function to add a job to the savedJobs list
const addSavedJob = asyncHandler(async function (req, res, next) {
  const { jobId } = req.body;
  const savedJobsId = req.user.savedJobsId;

  if (!jobId) return next(new AppError("JobId is needed to save the job", 400));

  // Checking if the job exist wiith that id
  const job = await Job.findById(jobId);

  if (!job) return next(new AppError("Invalid job Id.", 400));

  // Find the user's savedJobs using the savedJobs ID
  let savedJobs = await SavedJobs.findById(savedJobsId);
  if (!savedJobs) {
    savedJobs = await SavedJobs.create({ user: req.user._id, jobs: [] });
  }

  if (savedJobs.jobs.some((ele) => ele.toString() === job._id.toString()))
    return next(new AppError("Job is already saved", 400));

  savedJobs.jobs.push(job._id);
  await savedJobs.save();

  savedJobs = await savedJobs.populate("jobs");

  respondSuccess(200, savedJobs, res);
});

//funciton  to delete a job from the savedJobs list
const deleteSavedJob = asyncHandler(async function (req, res, next) {
  const { jobId } = req.body;
  const savedJobsId = req.user.savedJobsId;

  if (!jobId) return next(new AppError("Please provide id of the Job."));

  let savedJobs = await SavedJobs.findById(savedJobsId);
  if (!savedJobs)
    return next(new AppError("savedJobs List doesnt exist for this user", 400));

  const filteredSavedJobs = savedJobs.jobs.filter(
    (ele) => ele.toString() !== jobId.toString()
  );

  if (filteredSavedJobs.length === savedJobs.jobs.length)
    return next(new AppError("Job was not saved", 400));

  savedJobs.jobs = filteredSavedJobs;
  await savedJobs.save();

  savedJobs = await savedJobs.populate("jobs");
  respondSuccess(200, savedJobs, res);
});

//exporting the functions
const savedJobController = {
  getSavedJobs,
  addSavedJob,
  deleteSavedJob,
  createSavedJobs,
};

export default savedJobController;
