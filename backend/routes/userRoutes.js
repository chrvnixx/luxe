import express from "express";
import {
  adminUpdateUser,
  getUserById,
  getUsers,
  updateMe,
} from "../controllers/userControllers.js";
import { requireAdmin, requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", requireAdmin, getUsers);
router.get("/:id", requireAdmin, getUserById);
router.patch("/me", updateMe);
router.patch("/:id", requireAdmin, adminUpdateUser);

export default router;

