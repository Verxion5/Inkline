import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { aiKey } from "@/lib/ai.server";
import { buildRequestBody, imagesEndpoint } from "@/lib/imageProvider.server";

const Body = z.object({
  prompt: z.string().min(10).max(12000),
  negative: z.array(z.string()).max(60).default([]),
  aspect: z.enum(["4:3", "3:4", "16:9", "9:16", "1:1"]).default("4:3"),
  format: z.enum(["manga", "webtoon"]).default("manga"),
  quality: z.enum(["draft", "standard", "high"]).default("standard"),
  stream: z.boolean().default(true),
});

/** Upstream may answer with a hosted URL instead of inline base64; normalise to base64. */
async function resolveB64(payload: {
  data?: { b64_json?: string; url?: string }[];
}): Promise<string | undefined> {
  const first = payload.data?.[0];
  if (first?.b64_json) return first.b64_json;
  if (!first?.url) return undefined;
  const image = await fetch(first.url);
  if (!image.ok) return undefined;
  return Buffer.from(await image.arrayBuffer()).toString("base64");
}

function providerMessage(status: number, body: string): string {
  if (status === 401 || status === 403)
    return "Image generation is blocked — check that AI_API_KEY is valid.";
  if (status === 429) return "Rate limited — wait a moment and redraw.";
  if (status === 402) return "AI credits are exhausted for this provider.";
  if (status === 404) return "Image model not found — check AI_BASE_URL and AI_IMAGE_MODEL.";
  return body.slice(0, 400) || "Image provider error.";
}

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return new Response("Invalid image request", { status: 400 });
        const job = parsed.data;

        const key = aiKey();
        if (!key)
          return new Response(
            "Image generation is not configured (missing AI_API_KEY). Add a provider key and, if needed, AI_BASE_URL and AI_IMAGE_MODEL.",
            { status: 500 },
          );

        const upstream = await fetch(imagesEndpoint(), {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(buildRequestBody(job)),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(providerMessage(upstream.status, text), { status: upstream.status });
        }

        const b64 = await resolveB64(
          (await upstream.json().catch(() => ({}))) as {
            data?: { b64_json?: string; url?: string }[];
          },
        );
        if (!b64) return new Response("The image provider returned no image.", { status: 502 });

        if (!job.stream) {
          return new Response(JSON.stringify({ data: [{ b64_json: b64 }] }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // The images API answers in one shot; re-emit it as the single event the
        // client's stream reader already understands.
        const event = JSON.stringify({ type: "image_generation.completed", b64_json: b64 });
        return new Response(`event: image_generation.completed\ndata: ${event}\n\n`, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
