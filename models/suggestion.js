import mongoose from "mongoose";

const SuggestionSchema = new mongoose.Schema({
  pid: { type: String }, // optional: allow users to propose, or server can generate
  question: { type: String, required: true },
  yesLabel: { type: String, default: "YES" },
  noLabel: { type: String, default: "NO" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true }, // store a copy of username at submission time
  status: { type: String, enum: ["pending", "approved", "rejected", "archived"], default: "pending" },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who approved/rejected
  adminNote: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Use a hook that does not depend on a callback 'next' parameter.
// This keeps compatibility with Mongoose middleware that may call the hook without next.
SuggestionSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

export default mongoose.models.Suggestion ||
  mongoose.model("Suggestion", SuggestionSchema);