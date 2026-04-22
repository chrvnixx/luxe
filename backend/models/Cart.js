import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
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

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: { type: [cartItemSchema], default: [] },
    itemsPrice: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

cartSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;

