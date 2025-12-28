import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../lib/db";
import User from "../../../../models/user";
import Session from "../../../../models/session";

export async function POST(req) {
  const { email, password, confirmPassword, username } = await req.json();

  // 🔎 Basic validation
  if (!email || !password || !confirmPassword || !username) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  await connectDB();

  // 🔒 Email uniqueness (case-insensitive)
  const emailExists = await User.findOne({
    email: email.toLowerCase(),
  });

  if (emailExists) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 400 }
    );
  }

  // 🔒 Username uniqueness (case-insensitive check, stored as-is)
  const usernameExists = await User.findOne({
    usernameLower: username.toLowerCase(),
  });

  if (usernameExists) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email: email.toLowerCase(),
    username,                 // original case preserved
    usernameLower: username.toLowerCase(),
    password: hash,
  });

  const session = await Session.create({ userId: user._id });

  const res = NextResponse.json({ success: true });

  res.cookies.set("sessionId", session._id.toString(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });

  return res;
}
