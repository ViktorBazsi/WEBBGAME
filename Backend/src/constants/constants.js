import dotenv from "dotenv";
import path from "path";
dotenv.config(); 


export const PORT = Number(process.env.PORT) || 8000;
export const HOST = process.env.HOST || "http://localhost";


export const JWT_SECRET = process.env.JWT_SECRET;
export const { FRONTEND_URL } = process.env;
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads");
export const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || `${HOST}:${PORT}/uploads`;
