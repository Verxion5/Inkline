import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { buildRequestBody, IMAGES_ENDPOINT } from "@/lib/imageProvider.server";

const Body = z.object({
  prompt: z.string().min(10).max(12000),
  negative: z.array(z.string()).max(60).default([]),
  aspect: z.enum(["4:3", "3:4", "16:9", "9:16", "1:1"]).default("4:3"),
  format: z.enum(["manga", "webtoon"]).default("manga"),
  quality: z.enum(["draft", "standard", "high"]).default("standard"),
  stream: z.boolean().default(true),
});

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return new Response("Invalid image request", { status: 400 });
        const job = parsed.data;

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Image generation is not configured (missing LOVABLE_API_KEY).", { status: 500 });

        const upstream = await fetch(IMAGES_ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(buildRequestBody(job)),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          const msg =
            upstream.status === 429
              ? "Rate limited — wait a moment and redraw."
              : upstream.status === 402
                ? "AI credits are exhausted for this workspace."
                : upstream.status === 403
                  ? "AI access is blocked for this workspace."
                  : text.slice(0, 400) || "Image provider error.";
          return new Response(msg, { status: upstream.status });
        }

        if (!job.stream) {
          return new Response(upstream.body, { headers: { "Content-Type": "application/json" } });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
