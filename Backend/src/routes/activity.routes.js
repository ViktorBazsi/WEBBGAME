import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getActivities,
  getActivityById,
  postActivity,
  patchActivity,
  removeActivity,
} from "../controllers/activity.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getActivities);
router.get("/:id", getActivityById);
router.post("/", postActivity);
router.patch("/:id", patchActivity);
router.delete("/:id", removeActivity);

export default router;
