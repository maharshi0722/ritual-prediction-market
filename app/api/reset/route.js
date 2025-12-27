import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Prediction from "../../../models/prediction";

export async function POST() {
  await connectDB();
  await Prediction.deleteMany({});
  return NextResponse.json({ success: true });
}
