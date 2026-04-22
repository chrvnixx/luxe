import { z } from "zod";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";

const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
});

const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: z.string().optional(),
});

function calculateItemsPrice(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

async function assertCanAccessOrder(reqUser, order) {
  if (reqUser.role === "admin") return true;
  return String(order.user) === String(reqUser._id);
}

export async function createOrder(req, res) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid order payload" });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const itemsPrice = calculateItemsPrice(cart.items);
  const taxPrice = 0;
  const shippingPrice = 0;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  const order = await Order.create({
    user: req.user._id,
    orderItems: cart.items.map((i) => ({
      product: i.product,
      variantId: i.variantId,
      name: i.name,
      image: i.image,
      price: i.price,
      currency: i.currency,
      quantity: i.quantity,
    })),
    shippingAddress: parsed.data.shippingAddress,
    paymentMethod: parsed.data.paymentMethod || "card",
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    status: "pending",
    paymentStatus: "unpaid",
  });

  cart.items = [];
  cart.itemsPrice = 0;
  await cart.save();

  res.status(201).json({ order });
}

export async function getMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ orders });
}

export async function getOrderById(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!(await assertCanAccessOrder(req.user, order))) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.status(200).json({ order });
}

export async function markOrderPaid(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!(await assertCanAccessOrder(req.user, order))) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (order.paymentStatus === "paid") {
    return res.status(200).json({ order });
  }

  // Basic stock decrement on payment. For high concurrency, use transactions/reservations.
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      return res.status(400).json({ message: "Product no longer available" });
    }

    if (item.variantId) {
      const variant = product.variants?.find((v) => String(v._id) === String(item.variantId));
      if (!variant) {
        return res.status(400).json({ message: "Variant no longer available" });
      }
      if (variant.countInStock < item.quantity) {
        return res.status(400).json({ message: "Not enough stock" });
      }
      variant.countInStock -= item.quantity;
    } else {
      if (product.countInStock < item.quantity) {
        return res.status(400).json({ message: "Not enough stock" });
      }
      product.countInStock -= item.quantity;
    }

    await product.save();
  }

  order.paymentStatus = "paid";
  order.paidAt = new Date();
  order.status = "processing";
  await order.save();

  res.status(200).json({ order });
}

export async function markOrderDelivered(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.status = "delivered";
  order.deliveredAt = new Date();
  await order.save();

  res.status(200).json({ order });
}

