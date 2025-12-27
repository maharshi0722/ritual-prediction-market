import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now, expires: "7d" }, // auto-expire
});

export default mongoose.models.Session ||
  mongoose.model("Session", SessionSchema);
