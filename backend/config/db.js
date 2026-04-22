import mongoose from "mongoose";
import { env } from "./env.js";

export default async function connectDb() {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDb connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDb connection error", error);
    throw error;
  }
}
