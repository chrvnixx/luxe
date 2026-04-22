import bcrypt from "bcrypt";
import mongoose from "mongoose";

import connectDb from "../config/db.js";
import User from "../models/User.js";

async function main() {
  const [email, password, name = "Admin", phone = "0000000000"] =
    process.argv.slice(2);

  if (!email || !password) {
    console.log(
      "Usage: node backend/scripts/createAdmin.js <email> <password> [name] [phone]",
    );
    process.exit(1);
  }

  await connectDb();

  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email: email.toLowerCase().trim() });

  if (existing) {
    existing.password = hashedPassword;
    existing.role = "admin";
    existing.isVerified = true;
    if (name) existing.name = name;
    if (phone) existing.phone = phone;
    await existing.save();
    console.log(`Updated existing user to admin: ${existing.email}`);
  } else {
    const admin = await User.create({
      email: email.toLowerCase().trim(),
      name,
      phone,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });
    console.log(`Created admin user: ${admin.email}`);
  }

  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});

