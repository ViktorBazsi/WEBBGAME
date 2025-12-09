import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants/constants.js";
import HttpError from "../utils/HttpError.js";
import prisma from "../models/prisma-client.js";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError("Unauthorized", 401));
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // fetch role to attach
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true },
    });
    if (!user) return next(new HttpError("Unauthorized", 401));
    req.user = { id: user.id, role: user.role };
    return next();
  } catch (err) {
    return next(new HttpError("Invalid or expired token", 401));
  }
};

export default authMiddleware;
