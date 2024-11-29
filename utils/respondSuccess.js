/**
 * Sends a success response with the given status code, data, and other details.
 *
 * @param {number} statusCode - The HTTP status code to send.
 * @param {Object} [data={}] - The data to include in the response.
 * @param {Object} res - The Express response object.
 * @param {Object} [otherDetails={}] - Additional details to include in the response.
 */
export default function respondSuccess(
  statusCode,
  data = {},
  res,
  otherDetails = {}
) {
  res.status(statusCode).json({
    status: "success",
    ...otherDetails,
    data,
  });
}
