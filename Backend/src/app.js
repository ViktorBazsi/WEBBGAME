import express from "express";
import cors from "cors";
import errorHandler from "./middleware/error-handler.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import characterRoutes from "./routes/character.routes.js";
import girlfriendRoutes from "./routes/girlfriend.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import jobRoutes from "./routes/job.routes.js";
import locationRoutes from "./routes/location.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { FRONTEND_URL, UPLOAD_DIR } from "./constants/constants.js";
import { ensureUploadFolders } from "./utils/file.helper.js";

const app = express();

ensureUploadFolders();

app.use(
  cors({
    origin: FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/girlfriends", girlfriendRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/uploads", uploadRoutes);

app.use("/", (req, res) => {
  res.status(404).send("No Endpoint");
});

app.use(errorHandler);

export default app;
