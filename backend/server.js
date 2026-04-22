import connectDb from "./config/db.js";
import { env } from "./config/env.js";
import createApp from "./app.js";

const app = createApp();

async function start() {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
