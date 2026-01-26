import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema(
  {
    userId: String,
    choice: { type: String, enum: ["YES", "NO"] },
  },
  { _id: false }
);

const PredictionSchema = new mongoose.Schema(
  {
    pid: { type: String, unique: true, required: true },
    question: { type: String, default: "" },
    yesLabel: { type: String, default: "YES" },
    noLabel: { type: String, default: "NO" },
    yes: { type: Number, default: 0 },
    no: { type: Number, default: 0 },
    votes: [VoteSchema],
  },
  { timestamps: true }
);

// text index to support simple text search on question and labels
PredictionSchema.index({ question: "text", yesLabel: "text", noLabel: "text" });

export default mongoose.models.Prediction ||
  mongoose.model("Prediction", PredictionSchema);