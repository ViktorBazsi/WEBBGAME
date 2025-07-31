import express, { json } from "express";
import errorHandler from "./middleware/error-handler.middleware.js";

const app = express();

app.use(express.json());

app.use(errorHandler);

app.use("/", (req, res) => {
  res.status(404).send("No Endpoint");
});

export default app;