import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";

function getTokenFromRequest(req) {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);

  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "-password -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordTokenExpiresAt",
    );

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

