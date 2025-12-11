import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getActivities,
  getActivityById,
  postActivity,
  patchActivity,
  removeActivity,
  getSubActivities,
  postSubActivity,
  patchSubActivity,
  removeSubActivity,
  runSubActivity,
} from "../controllers/activity.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getActivities);
router.get("/:id", getActivityById);
router.post("/", postActivity); // admin-only in controller
router.patch("/:id", patchActivity); // admin-only in controller
router.delete("/:id", removeActivity); // admin-only in controller
router.get("/:id/subactivities", getSubActivities);
router.post("/:id/subactivities", postSubActivity); // admin-only in controller
router.patch("/:id/subactivities/:subId", patchSubActivity); // admin-only
router.delete("/:id/subactivities/:subId", removeSubActivity); // admin-only
router.post("/:charId/subactivities/:subId/execute", runSubActivity);

export default router;
