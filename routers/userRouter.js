import express from "express";
import authController from "../controllers/authController.js";
import userController from "../controllers/userController.js";

const router = express.Router();

// Routes for user related operations
router.post("/signup", authController.signUp);
router.post("/login", authController.login);

router.use(authController.protect); // Protect all routes that come after this middleware

router.get("/", userController.getLoggedInUser);
router.get("/stats", userController.getUserStats);
router.post("/logout", authController.logout);
router.patch("/change-password", authController.changePassword);

export default router;
