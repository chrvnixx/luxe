import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env, getCorsOriginList } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

function buildCorsOptions() {
  const allowList = getCorsOriginList();

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowList.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  };
}

export default function createApp() {
  const app = express();

  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  const apiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      ok: true,
      env: env.NODE_ENV,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

