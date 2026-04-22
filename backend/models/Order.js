import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", trim: true, uppercase: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: true },
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderItems: { type: [orderItemSchema], required: true },
    shippingAddress: { type: addressSchema, required: true },
    paymentMethod: { type: String, default: "card" },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    itemsPrice: { type: Number, required: true, min: 0 },
    taxPrice: { type: Number, default: 0, min: 0 },
    shippingPrice: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

orderSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;

