import { z } from "zod";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import { slugify } from "../utils/slugify.js";

const variantSchema = z.object({
  sku: z.string().optional(),
  attributes: z.record(z.string()).optional(),
  price: z.coerce.number().min(0).optional(),
  countInStock: z.coerce.number().int().min(0).optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  currency: z.string().length(3).optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(), // ObjectId or category slug
  brand: z.string().optional(),
  countInStock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
});

const updateProductSchema = createProductSchema.partial();

async function buildUniqueSlug(baseSlug) {
  let slug = baseSlug || "product";
  let counter = 1;
  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

async function resolveCategoryId(category) {
  if (!category) return undefined;
  if (isValidObjectId(category)) return category;
  const found = await Category.findOne({ slug: category, isActive: true });
  return found?._id;
}

export async function getProducts(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const q = String(req.query.q || "").trim();
  const category = String(req.query.category || "").trim();
  const sortParam = String(req.query.sort || "newest");

  const filter = { isActive: true };

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (category) {
    const categoryId = await resolveCategoryId(category);
    if (categoryId) filter.category = categoryId;
  }

  let sort = { createdAt: -1 };
  if (sortParam === "price_asc") sort = { price: 1 };
  if (sortParam === "price_desc") sort = { price: -1 };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("category", "name slug");

  res.status(200).json({
    products,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
}

export async function getProductById(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await Product.findById(id).populate("category", "name slug");
  if (!product || !product.isActive) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.status(200).json({ product });
}

export async function createProduct(req, res) {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid product payload" });
  }

  const data = parsed.data;
  const slug = await buildUniqueSlug(slugify(data.name));
  const categoryId = await resolveCategoryId(data.category);

  const product = await Product.create({
    name: data.name,
    slug,
    description: data.description || "",
    price: data.price,
    currency: data.currency,
    images: data.images || [],
    category: categoryId,
    brand: data.brand || "",
    countInStock: data.countInStock ?? 0,
    isActive: data.isActive ?? true,
    variants: data.variants || [],
  });

  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid product payload" });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const data = parsed.data;

  if (data.name) {
    product.name = data.name;
    product.slug = await buildUniqueSlug(slugify(data.name));
  }
  if (data.description !== undefined) product.description = data.description;
  if (data.price !== undefined) product.price = data.price;
  if (data.currency !== undefined) product.currency = data.currency;
  if (data.images !== undefined) product.images = data.images;
  if (data.brand !== undefined) product.brand = data.brand;
  if (data.countInStock !== undefined) product.countInStock = data.countInStock;
  if (data.isActive !== undefined) product.isActive = data.isActive;
  if (data.variants !== undefined) product.variants = data.variants;

  if (data.category !== undefined) {
    product.category = await resolveCategoryId(data.category);
  }

  await product.save();
  res.status(200).json({ product });
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  product.isActive = false;
  await product.save();

  res.status(200).json({ message: "Product archived" });
}

