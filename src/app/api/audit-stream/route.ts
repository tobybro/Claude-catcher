import { NextRequest } from "next/server";
import { getAuditEmitter, getAuditProgress } from "@/lib/run-agents";
import { reportExists } from "@/lib/report-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
    return new Response("Missing or invalid id parameter", { status: 400 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

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
          doCleanup();
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
        doCleanup();
      };

      const doCleanup = () => {
        emitter.removeListener("progress", onProgress);
        emitter.removeListener("complete", onComplete);
        if (timeoutHandle) clearTimeout(timeoutHandle);
      };

      cleanup = doCleanup;

      emitter.on("progress", onProgress);
      emitter.on("complete", onComplete);

      // Re-check completion after attaching listeners (race condition fix)
      if (reportExists(id)) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: "complete", reportId: id })}\n\n`
          )
        );
        controller.close();
        doCleanup();
        return;
      }

      // Timeout after 5 minutes
      timeoutHandle = setTimeout(() => {
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
        doCleanup();
      }, 300000);
    },

    // Clean up listeners when client disconnects
    cancel() {
      if (cleanup) cleanup();
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
