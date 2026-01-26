import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Suggestion from "@/models/suggestion";
import { getUserId } from "@/lib/getUser";

export const dynamic = "force-dynamic";

/**
 * POST /api/suggestions
 * Create a suggestion (authenticated).
 * This variant logs helpful debug info and returns error stacks in development.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    console.info("[/api/suggestions] POST body:", JSON.stringify(body));

    // get user
    const userId = await getUserId();
    console.info("[/api/suggestions] userId:", userId || "null");

    if (!userId) {
      console.warn("[/api/suggestions] unauthenticated request");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { pid, question, yesLabel, noLabel } = body || {};
    if (!question || !question.trim()) {
      console.warn("[/api/suggestions] validation failed - missing question");
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // ensure DB connected
    try {
      await connectDB();
      console.info("[/api/suggestions] DB connected");
    } catch (dbErr) {
      console.error("[/api/suggestions] DB connect error:", dbErr);
      // expose a friendly message
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // get username copy (optional)
    let username = "anonymous";
    try {
      const User = (await import("@/models/user")).default;
      const u = await User.findById(userId).lean();
      username = u?.username || username;
    } catch (userErr) {
      // not fatal; log and continue
      console.warn("[/api/suggestions] could not read user document:", userErr?.message || userErr);
    }

    // create suggestion
    const suggestion = await Suggestion.create({
      pid: pid ? pid.trim() : undefined,
      question: question.trim(),
      yesLabel: yesLabel?.trim() || undefined,
      noLabel: noLabel?.trim() || undefined,
      userId,
      username,
      status: "pending",
    });

    console.info("[/api/suggestions] suggestion created:", suggestion._id?.toString?.() || suggestion);

    return NextResponse.json({ success: true, suggestion });
  } catch (err) {
    // log server error
    console.error("[/api/suggestions] unexpected error:", err);

    // In development return stack for debugging; in prod keep generic
    const isDev = process.env.NODE_ENV !== "production";
    const payload = { error: "Server error" };
    if (isDev) {
      payload.detail = err?.message || String(err);
      payload.stack = err?.stack || "";
    }
    return NextResponse.json(payload, { status: 500 });
  }
}

/**
 * GET /api/suggestions?mine=true
 * - if mine=true, returns authenticated user's suggestions (pending/history)
 * - otherwise returns only approved suggestions (public)
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine") === "true";

    await connectDB();

    if (mine) {
      const userId = await getUserId();
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const items = await Suggestion.find({ userId }).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ suggestions: items });
    }

    const items = await Suggestion.find({ status: "approved" }).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ suggestions: items });
  } catch (err) {
    console.error("[/api/suggestions] GET error:", err);
    const isDev = process.env.NODE_ENV !== "production";
    const payload = { error: "Server error" };
    if (isDev) {
      payload.detail = err?.message || String(err);
      payload.stack = err?.stack || "";
    }
    return NextResponse.json(payload, { status: 500 });
  }
}