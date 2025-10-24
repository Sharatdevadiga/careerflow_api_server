import express from "express";
import jobController from "../controllers/jobController.js";
import authController from "../controllers/authController.js";
import appliedJobController from "../controllers/appliedJobController.js";

const router = express.Router();

// Public routes with optional auth (for isApplied/isSaved status)
router.get("/", authController.optionalAuth, jobController.getJobs);
router.get("/search/:searchtext", authController.optionalAuth, jobController.getSearchJobs);
router.get("/:id", jobController.getJob);

// Protected routes - require authentication
router.use(authController.protect);

// Employer-only routes - only employers can perform these actions
router.post("/", authController.restrictTo("employer"), jobController.createJob);
router.get("/employer/my-jobs", authController.restrictTo("employer"), jobController.getEmployerJobs);
router.get("/:id/applicants", authController.restrictTo("employer"), appliedJobController.getJobApplicants);
router.patch("/:id", authController.restrictTo("employer"), jobController.updateJob);
router.delete("/:id", authController.restrictTo("employer"), jobController.deleteJob);

export default router;
