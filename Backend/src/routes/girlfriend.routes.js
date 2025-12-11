import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getAllGirlfriends,
  getAllGirlfriendsAdmin,
  getOneGirlfriend,
  postGirlfriend,
  patchGirlfriend,
  removeGirlfriend,
  attachGirlfriendToCharacter,
  addJobForGirlfriend,
  getGirlfriendLifts,
  sleepGirlfriend,
} from "../controllers/girlfriend.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getAllGirlfriends);
router.get("/all/admin", getAllGirlfriendsAdmin);
router.get("/:id", getOneGirlfriend);
router.post("/", postGirlfriend); // admin-only enforced in controller
router.patch("/:id", patchGirlfriend); // admin-only in controller
router.delete("/:id", removeGirlfriend); // admin-only in controller
router.post("/:id/assign", attachGirlfriendToCharacter);
router.post("/:id/jobs", addJobForGirlfriend);
router.get("/:id/lifts", getGirlfriendLifts);
router.post("/:id/sleep", sleepGirlfriend);

export default router;
