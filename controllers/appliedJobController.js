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
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Get the user's applied jobs document
  const appliedJobsDoc = await AppliedJobs.findOne({ user: req.user._id }).populate({
    path: "jobs",
    options: {
      skip: skip,
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    }
  });

  // Handle case when user has no applied jobs document yet
  if (!appliedJobsDoc) {
    return respondSuccess(200, [], res, {
      results: 0,
      page: parseInt(page),
      totalPages: 0,
      total: 0
    });
  }

  // Get total count of applied jobs
  const totalAppliedJobs = appliedJobsDoc.jobs.length;
  const totalPages = Math.ceil(totalAppliedJobs / limit);

  // Get paginated jobs - we need to refetch with pagination since populate doesn't skip correctly
  const appliedJobsWithPagination = await AppliedJobs.findOne({ user: req.user._id })
    .select('jobs')
    .slice('jobs', [skip, parseInt(limit)])
    .populate('jobs');

  const jobs = appliedJobsWithPagination?.jobs || [];

  respondSuccess(200, jobs, res, {
    results: jobs.length,
    page: parseInt(page),
    totalPages,
    total: totalAppliedJobs
  });
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

  respondSuccess(200, appliedJobs, res);
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
  respondSuccess(200, appliedJobs, res);
});

// function to get all applicants for a specific job (for employers)
const getJobApplicants = asyncHandler(async function (req, res, next) {
  const jobId = req.params.id;

  if (!jobId) return next(new AppError("Job ID is required", 400));

  // Check if the job exists and belongs to the current user (employer)
  const job = await Job.findById(jobId);
  
  if (!job) return next(new AppError("Job not found", 404));

  // Check if the current user is the employer who posted this job
  if (job.employerId.toString() !== req.user._id.toString()) {
    return next(new AppError("You can only view applicants for your own job postings", 403));
  }

  // Find all applied jobs that contain this job ID
  const appliedJobsDocs = await AppliedJobs.find({ 
    jobs: jobId 
  }).populate('user', 'firstName lastName email');

  // Extract clean applicant information
  const applicants = appliedJobsDocs.map(appliedJob => ({
    applicationId: appliedJob._id,
    applicant: {
      userId: appliedJob.user._id,
      firstName: appliedJob.user.firstName,
      lastName: appliedJob.user.lastName,
      fullName: `${appliedJob.user.firstName} ${appliedJob.user.lastName}`,
      email: appliedJob.user.email,
    },
    appliedAt: appliedJob.updatedAt || appliedJob.createdAt,
  }));

  respondSuccess(200, {
    applicants,
    job: {
      _id: job._id,
      role: job.role || job.title,
      company: job.company,
      location: job.location
    },
    count: applicants.length 
  }, res);
});

const appliedJobController = {
  createAppliedJobs,
  getAppliedJobs,
  addAppliedJob,
  deleteAppliedJob,
  getJobApplicants,
};

export default appliedJobController;
