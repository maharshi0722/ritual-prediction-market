import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Prediction from "../../../models/prediction";

export async function GET() {
  await connectDB();
  const data = await Prediction.find({});
  return NextResponse.json(data);
}
