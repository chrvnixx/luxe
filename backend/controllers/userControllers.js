import { z } from "zod";
import User from "../models/User.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(5).optional(),
});

const adminUpdateUserSchema = z.object({
  role: z.enum(["customer", "admin"]).optional(),
  isVerified: z.boolean().optional(),
});

export async function getUsers(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const total = await User.countDocuments();
  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({ users, page, pages: Math.ceil(total / limit), total });
}

export async function getUserById(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ user });
}

export async function updateMe(req, res) {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid profile payload" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (parsed.data.name !== undefined) user.name = parsed.data.name;
  if (parsed.data.phone !== undefined) user.phone = parsed.data.phone;

  await user.save();
  res.status(200).json({ user });
}

export async function adminUpdateUser(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const parsed = adminUpdateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user payload" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (parsed.data.role !== undefined) user.role = parsed.data.role;
  if (parsed.data.isVerified !== undefined) user.isVerified = parsed.data.isVerified;

  await user.save();
  res.status(200).json({ user });
}

