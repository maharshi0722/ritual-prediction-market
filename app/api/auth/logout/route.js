import { NextResponse } from "next/server";
import Session from "../../../../models/session";
import { cookies } from "next/headers";
import { connectDB } from "../../../../lib/db";

export async function POST() {
  await connectDB();
  const sessionId = cookies().get("sessionId")?.value;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("sessionId", "", { maxAge: 0 });

  return res;
}
