import User from "../models/User.js";
import bcrypt from "bcrypt";
import generateTokenAndSetCookie from "../utils/generateTokenAndSetCookie.js";

export async function signup(req, res) {
  const { email, name, password, phone } = req.body;

  try {
    const userAlreadyExists = await User.findOne({ email });

    if (userAlreadyExists) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(100000 + Math.random() * 900000);

    const user = new User({
      email: email,
      name: name,
      password: hashedPassword,
      phone: phone,
      verificationToken: verificationToken,
      verificationTokenExpiresAt: Date.now() + 15 * 60 * 1000,
    });

    await user.save();

    generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      message: "User created successfully",
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log("Error in signup controller", error);
  }
}

export async function verifyEmail(req, res) {
  const { code } = req.body;
  try {
    if (!code) {
      return res.status(400).json({ message: "Input verification code" });
    }

    const user = await User.findOne({
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

    res
      .status(200)
      .json({ message: "User is verified", user: { ...user._doc } });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log("Error in verify email controller", error);
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  try {
    const user = User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const verifyPassword = await bcrypt.compare(password, user.password);

    if (!verifyPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user.lastLogin = Date.now();

    await user.save();

    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({ message: "User logged in", user: { ...user._doc } });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log("Error in login controller", error);
  }
}
