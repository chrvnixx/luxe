import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export default function generateTokenAndSetCookie(res, userId) {
  const token = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
  return token;
}

export function clearAuthCookie(res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}
