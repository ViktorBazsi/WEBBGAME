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
router.post("/", postJob);
router.patch("/:id", patchJob);
router.delete("/:id", removeJob);

export default router;
