import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    token: { type: Number, required: true }, // daily token
    status: { type: String, enum: ["pending", "served"], default: "pending" },
    counter: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" } // optional if you assign counters
  },
  { timestamps: true } // createdAt helps to reset tokens daily
);

export default mongoose.model("Customer", customerSchema);
