import express from "express";
import jobController from "../controllers/jobController.js";
import authController from "../controllers/authController.js";
import appliedJobController from "../controllers/appliedJobController.js";

const router = express.Router();

// Public routes with optional auth (for isApplied/isSaved status)
router.get("/", authController.optionalAuth, jobController.getJobs);
router.get("/search/:searchtext", authController.optionalAuth, jobController.getSearchJobs);
router.get("/:id", jobController.getJob);

// Middleware to protect routes, ensuring only authenticated users can access them
router.use(authController.protect);

// Employee routes (no restriction needed for viewing jobs)
// Employer-only routes
router.use(authController.restrictTo("employer"));
router.post("/", jobController.createJob);
router.get("/employer/my-jobs", jobController.getEmployerJobs);
router.get("/:id/applicants", appliedJobController.getJobApplicants);

router
  .route("/:id")
  .patch(jobController.updateJob)
  .delete(jobController.deleteJob);

export default router;
