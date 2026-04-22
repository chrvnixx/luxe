import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/productControllers.js";
import { requireAdmin, requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", requireAuth, requireAdmin, createProduct);
router.put("/:id", requireAuth, requireAdmin, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default router;

