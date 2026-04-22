import { z } from "zod";
import Category from "../models/Category.js";
import { slugify } from "../utils/slugify.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

async function buildUniqueSlug(baseSlug) {
  let slug = baseSlug || "category";
  let counter = 1;
  while (await Category.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

export async function getCategories(req, res) {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ categories });
}

export async function createCategory(req, res) {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid category payload" });
  }

  const { name, description } = parsed.data;
  const baseSlug = slugify(name);
  const slug = await buildUniqueSlug(baseSlug);

  const category = await Category.create({ name, slug, description });
  res.status(201).json({ category });
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid category id" });
  }

  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid category payload" });
  }

  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  if (parsed.data.name) {
    category.name = parsed.data.name;
    category.slug = await buildUniqueSlug(slugify(parsed.data.name));
  }
  if (parsed.data.description !== undefined) category.description = parsed.data.description;
  if (parsed.data.isActive !== undefined) category.isActive = parsed.data.isActive;

  await category.save();
  res.status(200).json({ category });
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid category id" });
  }

  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  category.isActive = false;
  await category.save();

  res.status(200).json({ message: "Category archived" });
}

