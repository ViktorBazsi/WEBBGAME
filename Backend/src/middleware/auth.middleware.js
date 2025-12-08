import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants/constants.js";
import HttpError from "../utils/HttpError.js";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError("Unauthorized", 401));
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id };
    return next();
  } catch (err) {
    return next(new HttpError("Invalid or expired token", 401));
  }
};

export default authMiddleware;
