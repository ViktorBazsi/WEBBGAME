import { Router } from "express";
import {
  listAllUsers,
  getProfile,
  updateProfile,
  deleteProfile,
} from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// Publikus listázás: foglaltság ellenőrzéshez
router.get("/", listAllUsers);

// Auth-köteles saját profil műveletek
router.get("/me", authMiddleware, getProfile);
router.patch("/me", authMiddleware, updateProfile);
router.delete("/me", authMiddleware, deleteProfile);

export default router;
