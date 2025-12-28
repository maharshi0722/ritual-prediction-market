import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://admin:maharshi@cluster0.seeerlm.mongodb.net/?appName=Cluster0";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGO_URI);
}
