import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export default async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDb has connected successfully");
  } catch (error) {
    console.log("MongoDb has run into some issues");
  }
}
