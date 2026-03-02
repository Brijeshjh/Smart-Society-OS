import { getDashboardEmitter } from "@/lib/server/dashboard-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const emitter = getDashboardEmitter();

  const stream = new ReadableStream({
    start(controller) {
      const onUpdate = (revision: number) => {
        controller.enqueue(encoder.encode(`event: update\ndata: ${revision}\n\n`));
      };

      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 25000);

      const onAbort = () => {
        clearInterval(pingInterval);
        emitter.off("update", onUpdate);
        controller.close();
      };

      emitter.on("update", onUpdate);
      request.signal.addEventListener("abort", onAbort);
      controller.enqueue(encoder.encode("event: ready\ndata: connected\n\n"));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
