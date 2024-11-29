import asyncHandler from "../utils/asyncHandler.js";
import respondSuccess from "../utils/respondSuccess.js";

// Controller function to get the currently logged-in user data
const getLoggedInUser = asyncHandler(async function (req, res, next) {
  const user = req.user;
  respondSuccess(201, { user }, res);
});

// Exporting userController object containing the getLoggedInUser function
const userController = {
  getLoggedInUser,
};
export default userController;
