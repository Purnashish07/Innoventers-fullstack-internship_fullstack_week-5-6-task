const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
exports.protect = (req, res, next) => {
  const t = req.headers.authorization?.split(" ")[1];
  if (!t) return next(new ApiError(401, "Not authorized, no token"));
  try {
    req.user = jwt.verify(t, process.env.JWT_SECRET);
    next();
  } catch {
    return next(new ApiError(401, "Not authorized, invalid token"));
  }
};
exports.authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new ApiError(403, "Not authorized for this action"));
    next();
  };
