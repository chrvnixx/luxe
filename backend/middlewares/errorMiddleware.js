import { env } from "../config/env.js";

export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found - ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : err?.message === "Not allowed by CORS"
        ? 403
        : 500;
  res.status(statusCode).json({
    message: err?.message || "Server Error",
    ...(env.NODE_ENV !== "production" ? { stack: err?.stack } : {}),
  });
}
