import { NextResponse } from "next/server";
import { sseStore } from "@/lib/sseStore";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const client = (data) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch {
          // 🔥 auto-remove dead clients
          sseStore.clients.delete(client);
        }
      };

      sseStore.clients.add(client);

      // optional retry hint
      controller.enqueue("retry: 1000\n\n");

      // ✅ IMPORTANT: DO NOT close controller manually
      return () => {
        sseStore.clients.delete(client);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export function emitUpdate(data) {
  // ✅ clone set to avoid mutation issues
  for (const client of [...sseStore.clients]) {
    try {
      client(data);
    } catch {
      sseStore.clients.delete(client);
    }
  }
}
