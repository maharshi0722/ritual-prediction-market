import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Prediction from "../../../models/prediction";
import { emitUpdate } from "../stream/route";
import { getUserId } from "../../../lib/getUser";

export async function POST(req) {
  // 🔐 Auth
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { pid, choice } = await req.json();

  // 🛑 Validate input
  if (!pid || !["YES", "NO"].includes(choice)) {
    return NextResponse.json(
      { error: "Invalid vote payload" },
      { status: 400 }
    );
  }

  await connectDB();

  // 📦 Find or create prediction
  let prediction = await Prediction.findOne({ pid });

  if (!prediction) {
    prediction = await Prediction.create({
      pid,
      yes: 0,
      no: 0,
      votes: [],
    });
  }

  // 🔍 Find existing vote
  const existing = prediction.votes.find(
    (v) => v.userId === userId
  );

  // 🗳 First vote
  if (!existing) {
    prediction.votes.push({ userId, choice });
    prediction[choice.toLowerCase()] += 1;
  }
  // 🔁 Change vote
  else if (existing.choice !== choice) {
    const prev = existing.choice.toLowerCase();

    prediction[prev] = Math.max(0, prediction[prev] - 1);
    prediction[choice.toLowerCase()] += 1;

    existing.choice = choice;
  }
  // ⏸ Same vote → no change
  else {
    return NextResponse.json({
      success: true,
      pid,
      yes: prediction.yes,
      no: prediction.no,
      userVote: choice,
    });
  }

  await prediction.save();

  // 🔥 Live update (SSE)
  emitUpdate({
    pid,
    yes: prediction.yes,
    no: prediction.no,
    votes: prediction.votes,
  });

  // ✅ Return updated state (important)
  return NextResponse.json({
    success: true,
    pid,
    yes: prediction.yes,
    no: prediction.no,
    userVote: choice,
  });
}
