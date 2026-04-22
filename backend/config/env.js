import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  COOKIE_DOMAIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

if (env.NODE_ENV === "production" && env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

export function getCorsOriginList() {
  const raw = (env.CORS_ORIGIN || "").trim();
  if (!raw) {
    return ["http://localhost:3000", "http://localhost:5173"];
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

