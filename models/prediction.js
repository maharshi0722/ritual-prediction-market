import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema(
  {
    userId: String,
    choice: { type: String, enum: ["YES", "NO"] },
  },
  { _id: false }
);

const PredictionSchema = new mongoose.Schema({
  pid: { type: String, unique: true },
  yes: { type: Number, default: 0 },
  no: { type: Number, default: 0 },
  votes: [VoteSchema],
});

export default mongoose.models.Prediction ||
  mongoose.model("Prediction", PredictionSchema);
