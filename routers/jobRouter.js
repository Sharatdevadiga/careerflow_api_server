import express from "express";
import jobController from "../controllers/jobController.js";
import authController from "../controllers/authController.js";

const router = express.Router();

router.get("/:id", jobController.getJob);
router.get("/search/:searchtext", jobController.getSearchJobs);

// Routes to handle job related functions
router.route("/").get(jobController.getJobs);

// Middleware to protect routes, ensuring only authenticated users can access them
router.use(authController.protect, authController.restrictTo("employer"));
router.post("./", jobController.createJob);

router
  .route("/:id")
  .patch(jobController.updateJob)
  .delete(jobController.deleteJob);

export default router;
