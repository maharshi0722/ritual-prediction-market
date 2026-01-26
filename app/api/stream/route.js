import { NextResponse } from "next/server";
import { addClient, removeClient, broadcast } from "@/lib/sseStore";

/**
 * GET /api/stream
 * Registers an SSE client and forwards broadcasts using the shared in-memory store.
 */
export async function GET(req) {
  const stream = new ReadableStream({
    start(controller) {
      // unique id for this connection
      const clientId = Math.random().toString(36).slice(2);

      // push helper that accepts either an already-formatted SSE payload string
      // or a plain object (we format to SSE payload here).
      const push = (msg) => {
        try {
          const payload = typeof msg === "string" ? msg : `data: ${JSON.stringify(msg)}\n\n`;
          controller.enqueue(payload);
        } catch (err) {
          // enqueue failed (likely closed) -> cleanup
          removeClient(clientId);
        }
      };

      // register the client callback
      addClient(clientId, push);

      // optional retry hint
      controller.enqueue("retry: 1000\n\n");

      // cleanup on client disconnect
      const onAbort = () => {
        removeClient(clientId);
        try { controller.close(); } catch (e) {}
      };

      // Next.js route handlers expose req.signal
      if (req?.signal) {
        req.signal.addEventListener("abort", onAbort);
      }

      // no explicit return value needed here; cleanup handled by abort listener
    },
    cancel() {
      // nothing special to do here — abort handler will run on client disconnect
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// Convenience for server code that previously imported emitUpdate from this route.
// Use broadcast() in lib/sseStore directly if you prefer.
export function emitUpdate(data) {
  // delegate to the store's broadcast helper which formats payloads and calls callbacks
  try {
    broadcast(data);
  } catch (err) {
    console.error("emitUpdate/broadcast failed:", err);
  }
}