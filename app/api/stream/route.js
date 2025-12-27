import { NextResponse } from "next/server";
import { sseStore } from "@/lib/sseStore";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const client = (data) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch {
          sseStore.clients.delete(client);
        }
      };

      sseStore.clients.add(client);

      controller.enqueue("retry: 1000\n\n");

      return () => {
        sseStore.clients.delete(client);
        try {
          controller.close();
        } catch {}
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
  for (const client of sseStore.clients) {
    try {
      client(data);
    } catch {
      sseStore.clients.delete(client);
    }
  }
}
