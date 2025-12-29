import { NextResponse } from "next/server";
import { getUserId } from "../../../lib/getUser";
import User from "../../../models/user";
import { connectDB } from "../../../lib/db";
import History from "../../../models/history";

const DAILY_CLAIM = 10; // adjust if needed

export async function POST() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();

  if (user.lastFaucetClaim) {
    const diff = now.getTime() - new Date(user.lastFaucetClaim).getTime();
    if (diff < 24 * 60 * 60 * 1000) {
      const remaining = 24 * 60 * 60 * 1000 - diff;
      return NextResponse.json(
        { error: "Already claimed", remainingMs: remaining },
        { status: 429 }
      );
    }
  }

  user.credits = (user.credits || 0) + DAILY_CLAIM;
  user.lastFaucetClaim = now;
  await user.save();

  try {
    await History.create({
      userId: user._id,
      username: user.username,
      type: "faucet",
      amount: DAILY_CLAIM,
      createdAt: now,
    });
  } catch (err) {
    console.error("History create failed:", err);
  }

  const nextClaimAt = new Date(user.lastFaucetClaim).getTime() + 24 * 60 * 60 * 1000;

  return NextResponse.json({
    success: true,
    credits: user.credits,
    nextClaimAt, // numeric ms
  });
}