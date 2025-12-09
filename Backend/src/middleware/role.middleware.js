import HttpError from "../utils/HttpError.js";

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new HttpError("Forbidden", 403));
  }
  return next();
};

export const requireUserOrAdmin = (req, res, next) => {
  if (!req.user) return next(new HttpError("Unauthorized", 401));
  return next();
};
