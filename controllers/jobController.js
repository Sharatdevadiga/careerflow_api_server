import Job from "../models/jobModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import respondSuccess from "../utils/respondSuccess.js";

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

  const doc = await Job.find({
    $or: [
      { role: { $regex: searchtext, $options: "i" } },
      { description: { $regex: searchtext, $options: "i" } },
    ],
  })
    .skip(skip)
    .limit(limit);

  // If no matching jobs are found, trigger an error
  if (doc.length === 0) {
    return next(new AppError("No matching jobs found", 404));
  }

  respondSuccess(200, { data: doc }, res, { results: doc.length, page });
});

/*


*/

// function to get all jobs
const getJobs = asyncHandler(async function (req, res, next) {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const doc = await Job.find().skip(skip).limit(limit);

  respondSuccess(200, { data: doc }, res, { results: doc.length, page });
});

/*


*/

//function to get a single job
const getJob = asyncHandler(async function (req, res, next) {
  let doc = await Job.findById(req.params.id);

  if (!doc) {
    return next(new AppError("No document found with that id", 404));
  }

  respondSuccess(200, { data: doc }, res);
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

  respondSuccess(200, { data: doc }, res);
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

  respondSuccess(200, { data: doc }, res);
});

/*


*/

// function  to delete a job
const deleteJob = asyncHandler(async function (req, res, next) {
  const doc = await Job.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError("No document found with that id", 404));
  }

  respondSuccess(204, { data: null }, res);
});

/*


*/

// Exporting all the functions
const jobController = {
  getJobs,
  getJob,
  getSearchJobs,
  createJob,
  updateJob,
  deleteJob,
};

export default jobController;
