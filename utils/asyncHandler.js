/**
 * Wraps an asynchronous function to handle errors and pass them to the next middleware.
 *
 * @param {Function} func - The asynchronous function to be wrapped.
 * @returns {Function} A new function that executes the given async function and handles errors.
 */

export default function asyncHandler(func) {
  return async function (req, res, next) {
    try {
      await func(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}
