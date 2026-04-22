import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/categoryControllers.js";
import { requireAdmin, requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", requireAuth, requireAdmin, createCategory);
router.put("/:id", requireAuth, requireAdmin, updateCategory);
router.delete("/:id", requireAuth, requireAdmin, deleteCategory);

export default router;

