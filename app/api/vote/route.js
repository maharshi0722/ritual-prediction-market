import { NextResponse } from "next/server";
import { getUserId } from "../../../lib/getUser";
import { connectDB } from "../../../lib/db";
import Prediction from "../../../models/prediction";
import User from "../../../models/user";
import History from "../../../models/history";
import { emitUpdate } from "../stream/route";

export async function POST(req) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { pid, choice, remove } = await req.json();

  if (!pid) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let prediction = await Prediction.findOne({ pid });
  if (!prediction) {
    prediction = await Prediction.create({ pid, yes: 0, no: 0, votes: [] });
  }

  const existing = prediction.votes.find(v => v.userId === userId);

  // REMOVE VOTE
  if (remove && existing) {
    const prev = existing.choice.toLowerCase();
    prediction[prev] = Math.max(0, prediction[prev] - 1);
    prediction.votes = prediction.votes.filter(v => v.userId !== userId);

    user.credits = (user.credits || 0) + 1; // refund
    await user.save();
    await prediction.save();

    try {
      await History.create({
        userId: user._id,
        username: user.username,
        type: "remove_vote",
        amount: 1,
        pid,
        choice: existing.choice,
      });
    } catch (err) {
      console.error("History create failed:", err);
    }

    emitUpdate({ pid, yes: prediction.yes, no: prediction.no, votes: prediction.votes });

    return NextResponse.json({ success: true, removed: true, credits: user.credits });
  }

  // CREDIT CHECK
  if (!existing && (user.credits || 0) < 1) {
    return NextResponse.json({ error: "Not enough credits" }, { status: 403 });
  }

  // FIRST VOTE
  if (!existing) {
    prediction.votes.push({ userId, choice });
    prediction[choice.toLowerCase()] += 1;

    user.credits = (user.credits || 0) - 1;
    await user.save();

    try {
      await History.create({
        userId: user._id,
        username: user.username,
        type: "vote",
        amount: -1,
        pid,
        choice,
      });
    } catch (err) {
      console.error("History create failed:", err);
    }
  }
  // CHANGE VOTE
  else if (existing.choice !== choice) {
    prediction[existing.choice.toLowerCase()] -= 1;
    prediction[choice.toLowerCase()] += 1;
    existing.choice = choice;

    try {
      await History.create({
        userId: user._id,
        username: user.username,
        type: "change_vote",
        amount: 0,
        pid,
        choice,
      });
    } catch (err) {
      console.error("History create failed:", err);
    }
  } else {
    return NextResponse.json({ success: true });
  }

  await prediction.save();

  emitUpdate({ pid, yes: prediction.yes, no: prediction.no, votes: prediction.votes });

  return NextResponse.json({ success: true, credits: user.credits });
}