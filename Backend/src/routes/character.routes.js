import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getAllCharacters,
  getOneCharacter,
  postCharacter,
  patchCharacter,
  removeCharacter,
  addJobForCharacter,
} from "../controllers/character.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getAllCharacters);
router.get("/:id", getOneCharacter);
router.post("/", postCharacter);
router.patch("/:id", patchCharacter);
router.delete("/:id", removeCharacter);
router.post("/:id/jobs", addJobForCharacter);

export default router;
