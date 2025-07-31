import dotenv from "dotenv";
dotenv.config(); 


export const PORT = Number(process.env.PORT) || 8000;
export const HOST = process.env.HOST || "http://localhost";


export const JWT_SECRET = process.env.JWT_SECRET;
export const { FRONTEND_URL } = process.env;