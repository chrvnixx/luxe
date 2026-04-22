import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  markOrderDelivered,
  markOrderPaid,
} from "../controllers/orderControllers.js";
import { requireAdmin, requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createOrder);
router.get("/my", getMyOrders);
router.get("/:id", getOrderById);
router.patch("/:id/pay", markOrderPaid);
router.patch("/:id/deliver", requireAdmin, markOrderDelivered);

export default router;

