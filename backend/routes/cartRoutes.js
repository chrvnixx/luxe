import express from "express";
import {
  addCartItem,
  clearCart,
  getMyCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cartControllers.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getMyCart);
router.post("/items", addCartItem);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/", clearCart);

export default router;

