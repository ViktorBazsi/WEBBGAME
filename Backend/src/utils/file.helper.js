import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "../constants/constants.js";

export const UPLOAD_FOLDERS = [
  "locations",
  "characters",
  "girlfriends",
  "activities",
  "jobs",
  "subactivity-images",
];

export const ensureUploadFolders = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  for (const folder of UPLOAD_FOLDERS) {
    const target = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
  }
};

export const getUploadPathForEntity = (entity) => {
  if (!entity) throw new Error("Hiányzik az entitás típus");
  const normalized = entity.toLowerCase();
  if (!UPLOAD_FOLDERS.includes(normalized)) {
    throw new Error(`Nem támogatott entitás: ${entity}`);
  }
  return path.join(UPLOAD_DIR, normalized);
};

export const buildRelativeImagePath = (entity, filename) => {
  const normalized = entity.toLowerCase();
  if (!UPLOAD_FOLDERS.includes(normalized)) {
    throw new Error(`Nem támogatott entitás: ${entity}`);
  }
  return `/uploads/${normalized}/${filename}`;
};

export const deleteFileIfExists = async (relativePath) => {
  if (!relativePath || typeof relativePath !== "string") return;
  if (!relativePath.startsWith("/uploads/")) return;
  const safePath = relativePath.replace(/^\/uploads\//, "");
  const absolutePath = path.join(UPLOAD_DIR, safePath);
  try {
    await fs.promises.unlink(absolutePath);
  } catch (err) {
    if (err && err.code !== "ENOENT") {
      throw err;
    }
  }
};
