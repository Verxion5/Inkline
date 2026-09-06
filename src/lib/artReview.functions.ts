import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AIError, chatJSON } from "./ai.server";
import { VISION_MODEL } from "./imageProvider.server";

const ReviewOut = z.object({
  score: z.number().min(0).max(10),
  verdict: z.enum(["accept", "refine"]),
  issues: z.array(z.string()).default([]),
  /** one targeted instruction to append to the prompt on regeneration */
  refinement: z.string().default(""),
});
export type ArtReview = z.infer<typeof ReviewOut>;

/**
 * Vision review pass: inspects a drawn panel against its brief and flags
 * anatomy, consistency, composition and text problems. Returns a verdict
 * and a single targeted refinement instruction.
 */
export const reviewPanelArt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        image: z.string().startsWith("data:image/").max(16_000_000),
        brief: z.string().min(10).max(8000),
        format: z.enum(["manga", "webtoon"]),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<ArtReview> => {
    try {
      const raw = await chatJSON<unknown>(
        `You are the Art Supervisor of Inkline, a professional ${data.format === "manga" ? "manga" : "webtoon/manhwa"} studio.
You inspect a single generated comic panel against its written brief and judge it like a strict senior editor.
Check, in order: (1) anatomy — hands, fingers, limb count, proportions, face symmetry; (2) character consistency with the brief — hair, eyes, outfit, props, age, number of characters; (3) composition — clear focal subject, depth separation, readable silhouette, no accidental cropping; (4) rendering — ${
          data.format === "manga"
            ? "true black-and-white inking with screentone/hatching, solid blacks, no color, no photorealism"
            : "polished colored line art, cinematic lighting, no 3D/CGI plastic look, no photorealism"
        }; (5) any text, letters, balloons, watermarks or signatures baked into the image.
Score 0-10. verdict "refine" if score < 7 OR any anatomy/text/consistency issue is clearly visible. The refinement must be ONE concrete, targeted drawing instruction (max 40 words) that fixes the worst issue without changing the shot.
Respond with JSON only: {"score":number,"verdict":"accept"|"refine","issues":string[],"refinement":string}`,
        [
          { type: "text", text: `Panel brief:\n${data.brief}` },
          { type: "image_url", image_url: { url: data.image } },
        ],
        VISION_MODEL,
      );
      return ReviewOut.parse(raw);
    } catch (e) {
      if (e instanceof AIError) throw new Error(e.message);
      if (e instanceof z.ZodError) throw new Error("Review returned an unexpected shape.");
      throw new Error(e instanceof Error ? e.message : "Review failed.");
    }
  });
