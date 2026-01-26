import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Suggestion from "../../../../models/suggestion";
import Prediction from "../../../../models/prediction";
import { getUserId } from "../../../../lib/getUser";
import { broadcast } from "../../../../lib/sseStore"; // send to SSE clients

// POST /api/suggestions/:id/approve  — only admin/curator should call this
export async function POST(req, { params }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // TODO: validate that userId has admin privileges.
  // For example, check a flag on the User model (isAdmin), or check specific user ids.
  const isAdmin = true; // replace with real check

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suggestionId = params.id;
  await connectDB();

  const suggestion = await Suggestion.findById(suggestionId);
  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  if (suggestion.status === "approved") {
    return NextResponse.json({ success: true, message: "Already approved" });
  }

  // Generate/normalize a pid if none provided or if conflicting
  let pid = suggestion.pid;
  if (!pid) {
    // simple slug generator from question + timestamp
    pid = suggestion.question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);

    // ensure uniqueness by appending suffix until unique
    let suffix = 0;
    while (await Prediction.findOne({ pid })) {
      suffix += 1;
      pid = `${pid}-${suffix}`;
    }
  } else {
    // if user-supplied pid conflicts, reject or append suffix
    if (await Prediction.findOne({ pid })) {
      // append numeric suffix
      let suffix = 1;
      let base = pid;
      while (await Prediction.findOne({ pid: `${base}-${suffix}` })) suffix++;
      pid = `${base}-${suffix}`;
    }
  }

  // Create Prediction document
  const created = await Prediction.create({
    pid,
    question: suggestion.question,
    yesLabel: suggestion.yesLabel || "YES",
    noLabel: suggestion.noLabel || "NO",
    yes: 0,
    no: 0,
    votes: [],
  });

  // mark suggestion approved (keep record)
  suggestion.status = "approved";
  suggestion.adminId = userId;
  await suggestion.save();

  // broadcast to SSE clients so they see the new prediction live
  try {
    broadcast({
      pid: created.pid,
      question: created.question,
      yes: created.yes,
      no: created.no,
      votes: created.votes,
      yesLabel: created.yesLabel,
      noLabel: created.noLabel,
    });
  } catch (err) {
    console.error("Broadcast failed on approve:", err);
  }

  return NextResponse.json({ success: true, prediction: created });
}