import express from "express";
import authController from "../controllers/authController.js";
import appliedJobController from "../controllers/appliedJobController.js";

const router = express.Router();

router.use(authController.protect); // Protect all routes that come after this middleware

router.use(authController.restrictTo("employee"));

router
  .route("/")
  .get(appliedJobController.getAppliedJobs)
  .post(appliedJobController.addAppliedJob)
  .delete(appliedJobController.deleteAppliedJob);

export default router;
