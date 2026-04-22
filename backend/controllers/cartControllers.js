import { z } from "zod";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";

const addItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
});

const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(1),
});

function calculateItemsPrice(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

async function getOrCreateCart(userId) {
  const existing = await Cart.findOne({ user: userId });
  if (existing) return existing;
  return Cart.create({ user: userId, items: [], itemsPrice: 0 });
}

function resolveVariant(product, variantId) {
  if (!variantId) return null;
  return product.variants?.find((v) => String(v._id) === String(variantId)) || null;
}

export async function getMyCart(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  res.status(200).json({ cart });
}

export async function addCartItem(req, res) {
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid cart payload" });
  }

  const { productId, variantId, quantity } = parsed.data;
  if (!isValidObjectId(productId)) {
    return res.status(400).json({ message: "Invalid product id" });
  }
  if (variantId && !isValidObjectId(variantId)) {
    return res.status(400).json({ message: "Invalid variant id" });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ message: "Product not found" });
  }

  const variant = resolveVariant(product, variantId);
  if (variantId && !variant) {
    return res.status(400).json({ message: "Variant not found" });
  }

  const price = variant?.price ?? product.price;
  const currency = product.currency;
  const stock = variant ? variant.countInStock : product.countInStock;

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.items.find(
    (item) =>
      String(item.product) === String(productId) &&
      String(item.variantId || "") === String(variantId || ""),
  );

  const nextQuantity = (existingItem?.quantity || 0) + quantity;
  if (stock < nextQuantity) {
    return res.status(400).json({ message: "Not enough stock" });
  }

  if (existingItem) {
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({
      product: product._id,
      variantId: variant?._id,
      name: product.name,
      image: product.images?.[0] || "",
      price,
      currency,
      quantity,
    });
  }

  cart.itemsPrice = calculateItemsPrice(cart.items);
  await cart.save();

  res.status(200).json({ cart });
}

export async function updateCartItem(req, res) {
  const { itemId } = req.params;
  if (!isValidObjectId(itemId)) {
    return res.status(400).json({ message: "Invalid item id" });
  }

  const parsed = updateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid cart payload" });
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(itemId);
  if (!item) {
    return res.status(404).json({ message: "Cart item not found" });
  }

  const product = await Product.findById(item.product);
  if (!product || !product.isActive) {
    return res.status(400).json({ message: "Product no longer available" });
  }

  const variant = resolveVariant(product, item.variantId);
  if (item.variantId && !variant) {
    return res.status(400).json({ message: "Variant no longer available" });
  }

  const stock = variant ? variant.countInStock : product.countInStock;
  if (stock < parsed.data.quantity) {
    return res.status(400).json({ message: "Not enough stock" });
  }

  item.quantity = parsed.data.quantity;
  item.price = variant?.price ?? product.price;
  item.currency = product.currency;
  item.name = product.name;
  item.image = product.images?.[0] || "";

  cart.itemsPrice = calculateItemsPrice(cart.items);
  await cart.save();

  res.status(200).json({ cart });
}

export async function removeCartItem(req, res) {
  const { itemId } = req.params;
  if (!isValidObjectId(itemId)) {
    return res.status(400).json({ message: "Invalid item id" });
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(itemId);
  if (!item) {
    return res.status(404).json({ message: "Cart item not found" });
  }

  item.deleteOne();
  cart.itemsPrice = calculateItemsPrice(cart.items);
  await cart.save();

  res.status(200).json({ cart });
}

export async function clearCart(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.itemsPrice = 0;
  await cart.save();
  res.status(200).json({ cart });
}

