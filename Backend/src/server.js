import app from "./app.js";
import { HOST, PORT } from "./constants/constants.js";

app.listen(PORT, () => {
  console.log(`Server is listening at ${HOST}:${PORT}...`);
});
