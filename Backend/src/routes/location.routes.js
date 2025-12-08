import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getLocations,
  getLocationById,
  postLocation,
  patchLocation,
  removeLocation,
} from "../controllers/location.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getLocations);
router.get("/:id", getLocationById);
router.post("/", postLocation);
router.patch("/:id", patchLocation);
router.delete("/:id", removeLocation);

export default router;
