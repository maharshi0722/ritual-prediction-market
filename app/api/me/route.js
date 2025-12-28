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

  const user = await User.findById(userId).select(
    "_id email username"
  );

  return NextResponse.json({ user });
}
