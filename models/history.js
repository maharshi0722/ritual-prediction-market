import mongoose from "mongoose";

const HistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  type: {
    type: String,
    enum: ["faucet", "vote", "remove_vote", "change_vote"],
    required: true,
  },
  amount: { type: Number, default: 0 }, // positive for credit in, negative for cost/refund
  pid: { type: String }, // prediction id when relevant
  choice: { type: String }, // "YES" / "NO" when relevant
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.History ||
  mongoose.model("History", HistorySchema);