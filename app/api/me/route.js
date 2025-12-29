import { NextResponse } from "next/server";
import { getUserId } from "../../../lib/getUser";
import User from "../../../models/user";
import { connectDB } from "../../../lib/db";

export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  await connectDB();

  // include credits and lastFaucetClaim so client has authoritative cooldown + balance
  const user = await User.findById(userId).select(
    "_id email username credits lastFaucetClaim"
  );

  return NextResponse.json({  user: {
    _id: user._id,
    username: user.username,
    credits: user.credits,
    lastFaucetClaim: user.lastFaucetClaim, // 🔑 REQUIRED
  }, });
}