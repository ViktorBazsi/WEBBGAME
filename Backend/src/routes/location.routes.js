import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getLocations,
  getLocationById,
  postLocation,
  patchLocation,
  removeLocation,
  addActivityToLoc,
} from "../controllers/location.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getLocations);
router.get("/:id", getLocationById);
router.post("/", postLocation); // admin-only in controller
router.patch("/:id", patchLocation); // admin-only in controller
router.delete("/:id", removeLocation); // admin-only in controller
router.post("/:id/activities", addActivityToLoc); // admin-only in controller

export default router;
