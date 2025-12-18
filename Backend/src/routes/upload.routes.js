import { Router } from "express";
import multer from "multer";
import path from "path";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  deleteImage,
  deleteSubActivityImageForTarget,
  getImages,
  getSubActivityImageForTarget,
  uploadImage,
  uploadSubActivityImageForTarget,
} from "../controllers/upload.controller.js";
import { getUploadPathForEntity } from "../utils/file.helper.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const targetDir = getUploadPathForEntity(req.params.entity);
      cb(null, targetDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${Date.now()}-${safeBase || "image"}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/:entity/:id", authMiddleware, upload.single("image"), uploadImage);
router.get("/:entity/:id", authMiddleware, getImages);
router.delete("/:entity/:id", authMiddleware, deleteImage);

const subActivityStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const targetDir = getUploadPathForEntity("subactivity-images");
      cb(null, targetDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${Date.now()}-${safeBase || "image"}${ext}`);
  },
});
const subActivityUpload = multer({ storage: subActivityStorage });

router.post(
  "/subactivities/:subId/images",
  authMiddleware,
  subActivityUpload.single("image"),
  uploadSubActivityImageForTarget,
);
router.get("/subactivities/:subId/images", authMiddleware, getSubActivityImageForTarget);
router.delete("/subactivities/:subId/images", authMiddleware, deleteSubActivityImageForTarget);

export default router;
