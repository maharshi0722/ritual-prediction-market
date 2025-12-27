import { cookies } from "next/headers";
import Session from "../models/session";
import { connectDB } from "./db";

export async function getUserId() {
  // ✅ cookies() is ASYNC now
  const cookieStore = await cookies();

  const sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) return null;

  await connectDB();
  const session = await Session.findById(sessionId);

  return session?.userId?.toString() || null;
}
