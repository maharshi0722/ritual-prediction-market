import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // hashed
  createdAt: { type: Date, default: Date.now },
  username: { type: String, required: true },
usernameLower: { type: String, required: true, unique: true },

});

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);
