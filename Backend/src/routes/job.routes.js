import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getJobs,
  getJobById,
  postJob,
  patchJob,
  removeJob,
} from "../controllers/job.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/", postJob); // admin-only in controller
router.patch("/:id", patchJob); // admin-only in controller
router.delete("/:id", removeJob); // admin-only in controller

export default router;
