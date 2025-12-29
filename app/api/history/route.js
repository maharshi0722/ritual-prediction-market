import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import History from "../../../models/history";
import { getUserId } from "../../../lib/getUser";

// GET /api/history?global=true&limit=50&skip=0
export async function GET(req) {
  await connectDB();

  const url = new URL(req.url);
  const global = url.searchParams.get("global") === "true";
  const limit = Math.min(200, parseInt(url.searchParams.get("limit") || "50", 10));
  const skip = parseInt(url.searchParams.get("skip") || "0", 10);

  if (global) {
    const items = await History.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return NextResponse.json({ history: items });
  }

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await History.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return NextResponse.json({ history: items });
}