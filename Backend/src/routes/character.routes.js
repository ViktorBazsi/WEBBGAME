import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getAllCharacters,
  getOneCharacter,
  postCharacter,
  patchCharacter,
  removeCharacter,
  addJobForCharacter,
  getCharacterLifts,
  sleepCharacter,
  workCharacterJob,
  removeJobForCharacter,
  promoteCharacterJob,
} from "../controllers/character.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getAllCharacters);
router.get("/:id", getOneCharacter);
router.post("/", postCharacter);
router.patch("/:id", patchCharacter);
router.delete("/:id", removeCharacter);
router.post("/:id/jobs", addJobForCharacter);
router.delete("/:id/jobs/:jobId", removeJobForCharacter);
router.post("/:id/jobs/:jobId/work", workCharacterJob);
router.post("/:id/jobs/:jobId/promote", promoteCharacterJob);
router.get("/:id/lifts", getCharacterLifts);
router.post("/:id/sleep", sleepCharacter);

export default router;
