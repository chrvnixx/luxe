import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { login, logout, me, signup, verifyEmail } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.get("/me", requireAuth, me);

export default router;
