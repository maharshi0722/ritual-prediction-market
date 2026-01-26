import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Prediction from "@/models/prediction";
import { getUserId } from "@/lib/getUser";
import { broadcast } from "@/lib/sseStore";

export const dynamic = "force-dynamic";

/**
 * GET /api/predictions
 * Returns all persisted predictions.
 */
export async function GET() {
  await connectDB();
  const data = await Prediction.find({}).lean();
  return NextResponse.json(data);
}

/**
 * POST /api/predictions
 * Create a new prediction (requires authentication) — this can be used if you want
 * suggestions to be created directly as predictions (requires admin or special flow).
 */
export async function POST(req) {
  await connectDB();

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { pid, question, yesLabel, noLabel } = body || {};

  if (!pid || !question) {
    return NextResponse.json({ error: "Invalid payload; pid and question required" }, { status: 400 });
  }

  try {
    const existing = await Prediction.findOne({ pid });
    if (existing) {
      return NextResponse.json({ error: "Prediction already exists" }, { status: 409 });
    }

    const created = await Prediction.create({
      pid,
      question,
      yesLabel: yesLabel || undefined,
      noLabel: noLabel || undefined,
      yes: 0,
      no: 0,
      votes: [],
    });

    try {
      broadcast({
        pid: created.pid,
        question: created.question,
        yes: created.yes,
        no: created.no,
        votes: created.votes,
        yesLabel: created.yesLabel,
        noLabel: created.noLabel,
      });
    } catch (bErr) {
      console.warn("SSE broadcast failed (non-fatal):", bErr);
    }

    return NextResponse.json({ success: true, prediction: created });
  } catch (err) {
    console.error("create prediction error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}