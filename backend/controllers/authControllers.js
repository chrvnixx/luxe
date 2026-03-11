import User from "../models/User.js";
import bcrypt from "bcrypt";
import generateTokenAndSetCookie from "../utils/generateTokenAndSetCookie.js";

export async function signup(req, res) {
  const { email, password, name, phone } = req.body;
  try {
    const userAlreadyExists = await User.findOne({ email });

    if (userAlreadyExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(100000 + Math.random() * 900000);

    const user = new User({
      email: email,
      name: name,
      password: hashedPassword,
      phone: phone,
      verificationToken: verificationToken,
      verificationTokenExpiresAt: Date.now() + 15 * 60 * 60,
    });

    await user.save();

    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      message: "Signup completed successfully",
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log("Error in signup controller", error);
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {}
}
