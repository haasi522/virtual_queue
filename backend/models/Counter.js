import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Counter", counterSchema);
