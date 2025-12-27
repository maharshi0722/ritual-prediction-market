import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../lib/db";
import User from "../../../../models/user";
import Session from "../../../../models/session";

export async function POST(req) {
  const { email, password } = await req.json();
  await connectDB();

  const exists = await User.findOne({ email });
  if (exists) {
    return NextResponse.json({ error: "User exists" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash });

  const session = await Session.create({ userId: user._id });

  const res = NextResponse.json({ success: true });
  res.cookies.set("sessionId", session._id.toString(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });

  return res;
}
