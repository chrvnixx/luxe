import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true },
    attributes: { type: Map, of: String, default: {} },
    price: { type: Number, min: 0 },
    countInStock: { type: Number, min: 0, default: 0 },
  },
  { _id: true },
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", trim: true, uppercase: true },
    images: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    brand: { type: String, default: "", trim: true },
    countInStock: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    variants: { type: [variantSchema], default: [] },
    reviews: { type: [reviewSchema], default: [] },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", description: "text" });

productSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Product = mongoose.model("Product", productSchema);

export default Product;

