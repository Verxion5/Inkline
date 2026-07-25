import { flushSync } from "react-dom";

/**
 * Stream image generation from a server route that proxies Lovable AI.
 * Calls onFrame with data URLs as partial frames arrive; onFrame(url, true)
 * fires for the final full-resolution frame.
 */
export async function streamImage(
  endpoint: string,
  prompt: string,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Image generation failed: ${res.status} ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastUrl: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        const delta = evt?.choices?.[0]?.delta;
        const imgs = delta?.images;
        if (Array.isArray(imgs) && imgs.length > 0) {
          const url = imgs[0]?.image_url?.url;
          if (typeof url === "string") {
            lastUrl = url;
            flushSync(() => onFrame(url, false));
          }
        }
      } catch {
        // ignore malformed frames
      }
    }
  }

  if (lastUrl) onFrame(lastUrl, true);
}
