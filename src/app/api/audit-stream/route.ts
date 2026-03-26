import { NextRequest } from "next/server";
import { getAuditEmitter, getAuditProgress } from "@/lib/run-agents";
import { reportExists } from "@/lib/report-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return new Response("Missing id parameter", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const emitter = getAuditEmitter(id);

      // Send any existing progress first
      const existingProgress = getAuditProgress(id);
      for (const p of existingProgress) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(p)}\n\n`)
        );
      }

      // Check if already complete
      if (reportExists(id)) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: "complete", reportId: id })}\n\n`
          )
        );
        controller.close();
        return;
      }

      const onProgress = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      };

      const onComplete = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ ...data as object, status: "complete" })}\n\n`
            )
          );
          controller.close();
        } catch {
          // Stream closed
        }
        cleanup();
      };

      const cleanup = () => {
        emitter.removeListener("progress", onProgress);
        emitter.removeListener("complete", onComplete);
      };

      emitter.on("progress", onProgress);
      emitter.on("complete", onComplete);

      // Timeout after 5 minutes
      setTimeout(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ status: "timeout" })}\n\n`
            )
          );
          controller.close();
        } catch {
          // Already closed
        }
        cleanup();
      }, 300000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
