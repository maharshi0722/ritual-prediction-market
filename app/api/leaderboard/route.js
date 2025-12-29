import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../lib/db";
import Prediction from "../../../models/prediction";
import User from "../../../models/user";
import Session from "../../../models/session";

export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const limit = Math.min(200, parseInt(url.searchParams.get("limit") || "50", 10));

    // aggregate active votes by votes.userId (strings)
    const pipeline = [
      { $unwind: "$votes" },
      { $group: { _id: "$votes.userId", votesCount: { $sum: 1 } } },
      { $sort: { votesCount: -1 } },
      { $limit: limit },
    ];

    let agg;
    try {
      agg = await Prediction.aggregate(pipeline).allowDiskUse(true);
    } catch (aggErr) {
      console.error("LEADERBOARD AGGREGATION ERROR:", aggErr && aggErr.stack ? aggErr.stack : aggErr);
      return NextResponse.json({ error: "Aggregation failed", detail: String(aggErr?.message || aggErr), stack: aggErr?.stack || "" }, { status: 500 });
    }

    if (!agg || agg.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // categorize id strings for lookup
    const idStrings = agg.map((r) => String(r._id).trim()).filter(Boolean);
    const objectIdCandidates = [];
    const usernameCandidates = [];
    const emailCandidates = [];

    for (const s of idStrings) {
      if (!s) continue;
      if (mongoose.Types.ObjectId.isValid(s)) {
        try {
          objectIdCandidates.push(new mongoose.Types.ObjectId(s));
        } catch {
          usernameCandidates.push(s.toLowerCase());
        }
      } else if (s.includes("@")) {
        emailCandidates.push(s.toLowerCase());
      } else {
        usernameCandidates.push(s.toLowerCase());
      }
    }

    // query User documents that match any candidate
    const orClauses = [];
    if (objectIdCandidates.length) orClauses.push({ _id: { $in: objectIdCandidates } });
    if (usernameCandidates.length) orClauses.push({ usernameLower: { $in: usernameCandidates } });
    if (emailCandidates.length) orClauses.push({ email: { $in: emailCandidates } });

    let users = [];
    try {
      if (orClauses.length) {
        users = await User.find({ $or: orClauses }).select("username usernameLower email").lean();
      }
    } catch (userErr) {
      console.error("LEADERBOARD USER QUERY ERROR:", userErr && userErr.stack ? userErr.stack : userErr);
      return NextResponse.json({ error: "User query failed", detail: String(userErr?.message || userErr), stack: userErr?.stack || "" }, { status: 500 });
    }

    const userById = new Map();
    const userByLower = new Map();
    const userByEmail = new Map();
    for (const u of users) {
      if (u && u._id) userById.set(String(u._id), u.username);
      if (u && u.usernameLower) userByLower.set(String(u.usernameLower), u.username);
      if (u && u.email) userByEmail.set(String(u.email).toLowerCase(), u.username);
    }

    // resolve unresolved ids via Session -> userId -> User (for votes stored as session ids)
    const unresolved = idStrings.filter((id) => {
      const idLower = id.toLowerCase();
      return !(userById.has(id) || userByLower.has(idLower) || userByEmail.has(idLower));
    });

    const unresolvedObjectIds = unresolved
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const sessionUserMap = new Map();

    if (unresolvedObjectIds.length) {
      try {
        const sessions = await Session.find({ _id: { $in: unresolvedObjectIds } }).select("userId").lean();
        const sessionUserIds = sessions.map((s) => String(s.userId)).filter(Boolean);

        const neededUserIds = sessionUserIds.filter((uid) => !userById.has(uid)).map((uid) => new mongoose.Types.ObjectId(uid));
        if (neededUserIds.length) {
          const sessionUsers = await User.find({ _id: { $in: neededUserIds } }).select("username").lean();
          for (const su of sessionUsers) {
            if (su && su._id) userById.set(String(su._id), su.username);
          }
        }

        for (const s of sessions) {
          const sid = String(s._id);
          const uid = String(s.userId);
          const uname = userById.get(uid) || null;
          if (uname) sessionUserMap.set(sid, uname);
        }
      } catch (sessErr) {
        console.error("LEADERBOARD SESSION QUERY ERROR:", sessErr && sessErr.stack ? sessErr.stack : sessErr);
        return NextResponse.json({ error: "Session resolution failed", detail: String(sessErr?.message || sessErr), stack: sessErr?.stack || "" }, { status: 500 });
      }
    }

    // assemble final leaderboard preserving order
    const short = (id) => (typeof id === "string" && id.length > 10 ? `${id.slice(0, 8)}…` : id);

    const leaderboard = agg.map((r, i) => {
      const idStr = String(r._id);
      const idLower = idStr.toLowerCase();

      const username =
        userById.get(idStr) ||
        userByLower.get(idLower) ||
        userByEmail.get(idLower) ||
        sessionUserMap.get(idStr) ||
        short(idStr);

      return {
        rank: i + 1,
        userId: idStr,
        username,
        votes: r.votesCount || 0,
      };
    });

    // debug info included — safe for local testing
    return NextResponse.json({
      leaderboard,
      debug: {
        aggCount: agg.length,
        idStringsSample: idStrings.slice(0, 10),
        matchedUsersCount: users.length,
        unresolvedSample: unresolved.slice(0, 10),
      },
    });
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err && err.stack ? err.stack : err);
    return NextResponse.json({ error: String(err?.message || err), stack: err?.stack || "" }, { status: 500 });
  }
}