import mongoose from "mongoose";

const queueSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tokenNumber: { type: Number, required: true },
  status: { type: String, enum: ["waiting", "serving", "done"], default: "waiting" },
  counter: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" }
}, { timestamps: true });

export default mongoose.model("Queue", queueSchema);
