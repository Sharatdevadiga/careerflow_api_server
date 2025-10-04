import Job from "../models/jobModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import respondSuccess from "../utils/respondSuccess.js";
import AppliedJobs from "../models/appliedJobsModel.js";
import SavedJobs from "../models/savedJobsModel.js";

// Helper function to add isApplied and isSaved status to jobs
async function enrichJobsWithUserStatus(jobs, userId) {
  if (!userId) {
    return jobs.map(job => ({
      ...job.toObject(),
      isApplied: false,
      isSaved: false
    }));
  }

  // Get user's applied and saved jobs
  const [appliedJobsDoc, savedJobsDoc] = await Promise.all([
    AppliedJobs.findOne({ user: userId }).select('jobs'),
    SavedJobs.findOne({ user: userId }).select('jobs')
  ]);

  const appliedJobIds = appliedJobsDoc?.jobs.map(id => id.toString()) || [];
  const savedJobIds = savedJobsDoc?.jobs.map(id => id.toString()) || [];

  return jobs.map(job => ({
    ...job.toObject(),
    isApplied: appliedJobIds.includes(job._id.toString()),
    isSaved: savedJobIds.includes(job._id.toString())
  }));
}

/*


*/
// function to search jobs based on search text
const getSearchJobs = asyncHandler(async function (req, res, next) {
  let { searchtext } = req.params;
  let { limit = 10, page = 1 } = req.query;

  // Check if searchtext is provided
  if (!searchtext) {
    return next(new AppError("Search text is required", 400));
  }
  const skip = (page - 1) * limit;

  // Build the search query
  const searchQuery = {
    $or: [
      { role: { $regex: searchtext, $options: "i" } },
      { description: { $regex: searchtext, $options: "i" } },
    ],
  };

  // Get total count for pagination
  const total = await Job.countDocuments(searchQuery);
  
  // Get paginated results
  const jobs = await Job.find(searchQuery)
    .skip(skip)
    .limit(parseInt(limit));

  // If no matching jobs are found, trigger an error
  if (jobs.length === 0) {
    return next(new AppError("No matching jobs found", 404));
  }

  // Enrich jobs with user status
  const enrichedJobs = await enrichJobsWithUserStatus(jobs, req.user?._id);

  const totalPages = Math.ceil(total / limit);

  respondSuccess(200, enrichedJobs, res, { 
    results: enrichedJobs.length, 
    page: parseInt(page),
    totalPages,
    total
  });
});

/*


*/

// function to get all jobs
const getJobs = asyncHandler(async function (req, res, next) {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await Job.countDocuments();
  
  // Get paginated results
  const jobs = await Job.find()
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ date: -1 });

  // Enrich jobs with user status
  const enrichedJobs = await enrichJobsWithUserStatus(jobs, req.user?._id);

  const totalPages = Math.ceil(total / limit);

  respondSuccess(200, enrichedJobs, res, { 
    results: enrichedJobs.length, 
    page: parseInt(page),
    totalPages,
    total
  });
});

/*


*/

//function to get a single job
const getJob = asyncHandler(async function (req, res, next) {
  let doc = await Job.findById(req.params.id);

  if (!doc) {
    return next(new AppError("No document found with that id", 404));
  }

  respondSuccess(200, doc, res);
});

/*


*/

// funciton to create a new job
const createJob = asyncHandler(async function (req, res, next) {
  const { role, date, locations, description, remote } = req.body;
  const { company, _id: employerId } = req.user;

  if (!role || !date || !locations || !description) {
    return next(
      new AppError(
        "Please provide following details: role, date, locations and description"
      )
    );
  }

  const doc = await Job.create({
    role,
    date,
    locations,
    description,
    remote,
    company,
    employerId,
  });

  respondSuccess(200, doc, res);
});

/*


*/

//function to update a job
const updateJob = asyncHandler(async function (req, res, next) {
  const doc = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    return next(new AppError("No document found with that id", 404));
  }

  respondSuccess(200, doc, res);
});

/*


*/

// function  to delete a job
const deleteJob = asyncHandler(async function (req, res, next) {
  const doc = await Job.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError("No document found with that id", 404));
  }

  respondSuccess(204, null, res);
});


// Get jobs created by the logged-in employer
const getEmployerJobs = asyncHandler(async function (req, res, next) {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  
  // Get total count for pagination
  const total = await Job.countDocuments({ employerId: req.user._id });
  
  // Get paginated results
  const jobs = await Job.find({ employerId: req.user._id })
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  console.log(jobs);
  console.log(req.user._id);
  
  const totalPages = Math.ceil(total / limit);
    
  respondSuccess(200, jobs, res, { 
    results: jobs.length, 
    page: parseInt(page),
    totalPages,
    total,
    employerId: req.user._id 
  });
});

/*


*/

// Get applicants for a specific job
const getJobApplicants = asyncHandler(async function (req, res, next) {
  const jobId = req.params.id;
  
  // First verify this job belongs to the current employer
  const job = await Job.findOne({ _id: jobId, employerId: req.user._id });
  if (!job) {
    return next(new AppError("Job not found or you don't have permission to view applicants", 404));
  }
  
  // Find all applications for this job and populate user details
  const AppliedJobs = (await import("../models/appliedJobsModel.js")).default;
  
  const applicants = await AppliedJobs.find({ 
    jobs: { $in: [jobId] } 
  }).populate({
    path: 'user',
    select: 'firstName lastName email type'
  });
  
  // Extract user details from applicants
  const applicantList = applicants.map(application => ({
    applicationId: application._id,
    applicant: application.user,
    appliedAt: application.createdAt || new Date()
  }));
  
  respondSuccess(200, { 
    data: applicantList,
    job: {
      id: job._id,
      role: job.role,
      company: job.company
    }
  }, res, { results: applicantList.length });
});


// Exporting all the functions
const jobController = {
  getJobs,
  getJob,
  getSearchJobs,
  createJob,
  updateJob,
  deleteJob,
  getEmployerJobs,
  getJobApplicants,
};

export default jobController;
