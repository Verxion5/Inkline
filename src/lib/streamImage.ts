/**
 * Stream image generation from the /api/generate-image server route.
 * `body` is the full request body (prompt, negative, aspect, format, quality).
 * onFrame receives data URLs; the last call has isFinal=true.
 */
export type ImageRequestBody = {
  prompt: string;
  negative: string[];
  aspect: string;
  format: string;
  quality: string;
};

export async function streamImage(
  endpoint: string,
  body: ImageRequestBody,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!res.ok || !res.body) {
    throw new Error((await res.text().catch(() => "")).slice(0, 240) || `Image generation failed (${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawAny = false;
  let sawFinal = false;
  let streamError: string | null = null;
  let currentEvent = "";

  const handle = (eventName: string, payloadRaw: string) => {
    if (!payloadRaw || payloadRaw === "[DONE]") return;
    let evt: Record<string, unknown>;
    try {
      evt = JSON.parse(payloadRaw);
    } catch {
      return;
    }
    const type = (evt["type"] as string) ?? eventName;
    if (type === "error" || eventName === "error") {
      sawAny = true;
      const err = evt["error"] as { message?: string } | undefined;
      streamError = err?.message ?? "Image generation failed.";
      return;
    }
    const b64 = evt["b64_json"] as string | undefined;
    if (typeof b64 === "string") {
      sawAny = true;
      const final = type.endsWith(".completed");
      if (final) sawFinal = true;
      onFrame(`data:image/png;base64,${b64}`, final);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, "");
        if (line.startsWith("event:")) currentEvent = line.slice(6).trim();
        else if (line.startsWith("data:")) handle(currentEvent, line.slice(5).trim());
        else if (line === "") currentEvent = "";
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  if (streamError) throw new Error(streamError);

  if (!sawAny) {
    // Zero events: transport hiccup. Replay once, non-streamed.
    const replay = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, stream: false }),
    });
    if (!replay.ok) throw new Error((await replay.text().catch(() => "")).slice(0, 240) || "Image generation failed.");
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image generation returned no image.");
    onFrame(`data:image/png;base64,${b64}`, true);
    return;
  }

  if (!sawFinal) throw new Error("Image stream ended early — redraw this panel.");
}
