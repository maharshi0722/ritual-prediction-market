import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../lib/db";
import User from "../../../../models/user";
import Session from "../../../../models/session";

export async function POST(req) {
  const { email, password } = await req.json();
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await Session.create({ userId: user._id });

  const res = NextResponse.json({ success: true });
  res.cookies.set("sessionId", session._id.toString(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });

  return res;
}
