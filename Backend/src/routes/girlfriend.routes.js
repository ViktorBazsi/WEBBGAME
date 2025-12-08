import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getAllGirlfriends,
  getOneGirlfriend,
  postGirlfriend,
  patchGirlfriend,
  removeGirlfriend,
  attachGirlfriendToCharacter,
} from "../controllers/girlfriend.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getAllGirlfriends);
router.get("/:id", getOneGirlfriend);
router.post("/", postGirlfriend);
router.patch("/:id", patchGirlfriend);
router.delete("/:id", removeGirlfriend);
router.post("/:id/assign", attachGirlfriendToCharacter);

export default router;
