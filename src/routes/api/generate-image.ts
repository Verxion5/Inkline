import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { buildRequestBody } from "@/lib/imageProvider.server";
import { aiApiKey, hasKey, imagesGenerationsUrl, NOT_CONFIGURED_MESSAGE } from "@/lib/ai.server";

const Body = z.object({
  prompt: z.string().min(10).max(12000),
  negative: z.array(z.string()).max(60).default([]),
  aspect: z.enum(["4:3", "3:4", "16:9", "9:16", "1:1"]).default("4:3"),
  format: z.enum(["manga", "webtoon"]).default("manga"),
  quality: z.enum(["draft", "standard", "high"]).default("standard"),
  stream: z.boolean().default(true),
});

type ImagesResponse = {
  data?: { b64_json?: string; url?: string }[];
};

/** The chat-style client consumes b64 frames, so a URL response is inlined. */
async function toBase64(
  entry: { b64_json?: string; url?: string } | undefined,
): Promise<string | null> {
  if (!entry) return null;
  if (typeof entry.b64_json === "string" && entry.b64_json) return entry.b64_json;
  if (typeof entry.url === "string" && entry.url) {
    const image = await fetch(entry.url).catch(() => null);
    if (!image?.ok) return null;
    return Buffer.from(await image.arrayBuffer()).toString("base64");
  }
  return null;
}

function failureMessage(status: number, text: string): string {
  // Never echo the provider's 401 body: it can repeat part of the key.
  if (status === 401) return `${NOT_CONFIGURED_MESSAGE} The provider rejected the key.`;
  if (status === 402) return "AI credits are exhausted for this workspace.";
  if (status === 403) return "AI access is blocked for this workspace.";
  if (status === 404)
    return `The configured image model is unavailable. Check AI_IMAGE_MODEL. (${text.slice(0, 200)})`;
  if (status === 429) return "Rate limited — wait a moment and redraw.";
  return text.slice(0, 400) || "Image provider error.";
}

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          hasKey()
            ? { configured: true, message: "Image generation is ready." }
            : { configured: false, message: NOT_CONFIGURED_MESSAGE },
        ),
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return new Response("Invalid image request", { status: 400 });
        const job = parsed.data;

        const key = aiApiKey();
        if (!key) return new Response(NOT_CONFIGURED_MESSAGE, { status: 503 });

        const upstream = await fetch(imagesGenerationsUrl(), {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(buildRequestBody(job)),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(failureMessage(upstream.status, text), { status: upstream.status });
        }

        const json = (await upstream.json().catch(() => ({}))) as ImagesResponse;
        const b64 = await toBase64(json.data?.[0]);
        if (!b64) return new Response("Image generation returned no image.", { status: 502 });

        if (!job.stream) {
          return Response.json({ data: [{ b64_json: b64 }] });
        }

        // The images endpoint answers in one shot; emit it as a single final
        // server-sent event so the client's streaming path stays unchanged.
        const frame = JSON.stringify({ type: "image.completed", b64_json: b64 });
        return new Response(`event: image.completed\ndata: ${frame}\n\n`, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
