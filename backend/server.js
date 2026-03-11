import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import connectDb from "./config/db.js";

dotenv.config();

const port = process.env.PORT;

const app = express();

app.use("/api/auth", authRoutes);

app.listen(port, () => {
  connectDb();
  console.log(`Server is running on port ${port}`);
});
