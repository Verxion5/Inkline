import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiKey } from "@/lib/ai.server";
import {
  buildRequestBody,
  hasImageKey,
  imageModel,
  imagesEndpoint,
} from "@/lib/imageProvider.server";

const Body = z.object({
  prompt: z.string().min(10).max(12000),
  negative: z.array(z.string()).max(60).default([]),
  aspect: z.enum(["4:3", "3:4", "16:9", "9:16", "1:1"]).default("4:3"),
  format: z.enum(["manga", "webtoon"]).default("manga"),
  quality: z.enum(["draft", "standard", "high"]).default("standard"),
  stream: z.boolean().default(true),
});

/** Statuses that mean "this provider has no streamed image events". */
const STREAM_UNSUPPORTED = new Set([400, 404, 405, 422, 501]);

function providerErrorMessage(status: number, text: string): string {
  if (status === 401) return "The AI provider rejected the API key. Check AI_API_KEY.";
  if (status === 429) return "Rate limited — wait a moment and redraw.";
  if (status === 402) return "AI credits are exhausted for this API key.";
  if (status === 403) return "AI access is blocked for this API key.";
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message.slice(0, 400);
  } catch {
    // not JSON — fall through to the raw text
  }
  return text.slice(0, 400) || "Image provider error.";
}

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          configured: hasImageKey(),
          model: imageModel(),
          message: hasImageKey()
            ? `Image generation is configured (${imageModel()}).`
            : "Image generation is not configured. Set AI_API_KEY in the server environment.",
        }),
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return new Response("Invalid image request", { status: 400 });
        const job = parsed.data;

        const key = apiKey();
        if (!key) {
          return new Response(
            "Image generation is not configured. Set AI_API_KEY in the server environment.",
            {
              status: 500,
            },
          );
        }

        const send = (stream: boolean) =>
          fetch(imagesEndpoint(), {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify(buildRequestBody({ ...job, stream })),
          });

        let upstream: Response;
        try {
          upstream = await send(job.stream);
          // Some compatible providers reject `stream`; fall back to one JSON call.
          if (job.stream && STREAM_UNSUPPORTED.has(upstream.status)) {
            await upstream.body?.cancel().catch(() => undefined);
            upstream = await send(false);
          }
        } catch {
          return new Response(
            `Could not reach the image provider at ${imagesEndpoint()}. Check AI_BASE_URL.`,
            {
              status: 502,
            },
          );
        }

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(providerErrorMessage(upstream.status, text), {
            status: upstream.status,
          });
        }

        const contentType = upstream.headers.get("content-type") ?? "";
        if (!job.stream || !contentType.includes("text/event-stream")) {
          return new Response(upstream.body, { headers: { "Content-Type": "application/json" } });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
