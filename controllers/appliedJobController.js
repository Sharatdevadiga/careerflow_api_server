import AppliedJobs from "../models/appliedJobsModel.js";
import Job from "../models/jobModel.js";
import AppError from "../utils/appError.js";
import asyncHandler from "../utils/asyncHandler.js";
import respondSuccess from "../utils/respondSuccess.js";

// function to create appliedJobs for a user
async function createAppliedJobs(userId, next) {
  try {
    const newAppliedJobs = await AppliedJobs.create({ user: userId });

    return newAppliedJobs;
  } catch (err) {
    next(err);
  }
}

// function to get all the appliedJobs for a user
const getAppliedJobs = asyncHandler(async function (req, res, next) {
  let appliedJobs = await AppliedJobs.find({ user: req.user._id }).populate("jobs")

  respondSuccess(200, { appliedJobs }, res);
});

//function to add a job to the appliedJobs list
const addAppliedJob = asyncHandler(async function (req, res, next) {
  const { jobId } = req.body;
  const appliedJobsId = req.user.appliedJobsId;

  if (!jobId) return next(new AppError("JobId is needed to save the job", 400));

  // Checking if the job exist wiith that id
  const job = await Job.findById(jobId);

  if (!job) return next(new AppError("Invalid job Id.", 400));

  // Find the user's appliedJobs using the appliedJobs ID
  let appliedJobs = await AppliedJobs.findById(appliedJobsId);
  if (!appliedJobs) {
    appliedJobs = await AppliedJobs.create({ user: req.user._id, jobs: [] });
  }

  if (appliedJobs.jobs.some((ele) => ele.toString() === job._id.toString()))
    return next(new AppError("Job is already applied", 400));

  appliedJobs.jobs.push(job._id);
  await appliedJobs.save();

  appliedJobs = await appliedJobs.populate("jobs");

  respondSuccess(200, { appliedJobs }, res);
});

// function to delete a job from the appliedJobs list
const deleteAppliedJob = asyncHandler(async function (req, res, next) {
  const { jobId } = req.body;
  const appliedJobsId = req.user.appliedJobsId;

  if (!jobId) return next(new AppError("Please provide id of the Job."));

  let appliedJobs = await AppliedJobs.findById(appliedJobsId);
  if (!appliedJobs)
    return next(
      new AppError("appliedJobs List doesnt exist for this user", 400)
    );

  const filteredappliedJobs = appliedJobs.jobs.filter(
    (ele) => ele.toString() !== jobId.toString()
  );

  if (filteredappliedJobs.length === appliedJobs.jobs.length)
    return next(new AppError("Job was not applied", 400));

  appliedJobs.jobs = filteredappliedJobs;
  await appliedJobs.save();

  appliedJobs = await appliedJobs.populate("jobs");
  respondSuccess(200, { appliedJobs }, res);
});

const appliedJobController = {
  createAppliedJobs,
  getAppliedJobs,
  addAppliedJob,
  deleteAppliedJob,
};

export default appliedJobController;
