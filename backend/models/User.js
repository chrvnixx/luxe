import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Input your email here"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Input password here"],
    },
    name: {
      type: String,
      required: [true, "Input your full name here"],
    },
    phone: {
      type: String,
      required: [true, "INput your phone number here"],
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpiresAt: Date,
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.verificationTokenExpiresAt;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordTokenExpiresAt;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
