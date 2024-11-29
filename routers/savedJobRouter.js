import express from "express";
import authController from "../controllers/authController.js";
import savedJobController from "../controllers/savedJobController.js";

const router = express.Router();

router.use(authController.protect); // Protect all routes that come after this middleware

router.use(authController.restrictTo("employee"));

router
  .route("/")
  .get(savedJobController.getSavedJobs)
  .post(savedJobController.addSavedJob)
  .delete(savedJobController.deleteSavedJob);

export default router;
