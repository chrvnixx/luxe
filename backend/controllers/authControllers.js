import User from "../models/User.js";
import bcrypt from "bcrypt";
import { z } from "zod";
import generateTokenAndSetCookie, {
  clearAuthCookie,
} from "../utils/generateTokenAndSetCookie.js";
import { env } from "../config/env.js";

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  phone: z.string().min(5),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signup(req, res) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid signup payload" });
  }

  const { email, name, password, phone } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const userAlreadyExists = await User.findOne({ email: normalizedEmail });

    if (userAlreadyExists) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = String(Math.floor(100000 + Math.random() * 900000));

    const user = new User({
      email: normalizedEmail,
      name: name,
      password: hashedPassword,
      phone: phone,
      verificationToken: verificationToken,
      verificationTokenExpiresAt: Date.now() + 15 * 60 * 1000,
    });

    await user.save();

    res.status(201).json({
      message: "User created. Please verify your email.",
      ...(env.NODE_ENV !== "production"
        ? { verificationCode: verificationToken }
        : {}),
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log("Error in signup controller", error);
  }
}

export async function verifyEmail(req, res) {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid verification payload" });
  }

  const { email, code } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const user = await User.findOne({
      email: normalizedEmail,
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired Code" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;

    await user.save();

    generateTokenAndSetCookie(res, user._id);

    res
      .status(200)
      .json({ message: "User is verified", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log("Error in verify email controller", error);
  }
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid login payload" });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const verifyPassword = await bcrypt.compare(password, user.password);

    if (!verifyPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email" });
    }

    user.lastLogin = Date.now();

    await user.save();

    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({ message: "User logged in", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log("Error in login controller", error);
  }
}

export async function logout(req, res) {
  clearAuthCookie(res);
  res.status(200).json({ message: "Logged out" });
}

export async function me(req, res) {
  res.status(200).json({ user: req.user });
}
