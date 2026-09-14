import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AIError, ORIGINALITY_RULE, chatJSON, hasKey } from "./ai.server";

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */

const BrainOut = z.object({
  title: z.string(),
  logline: z.string(),
  genre: z.string(),
  tone: z.string(),
  themes: z.array(z.string()).default([]),
  lore: z.string().default(""),
  organizations: z.array(z.string()).default([]),
  items: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  characters: z
    .array(
      z.object({
        name: z.string(),
        age: z.string().default(""),
        role: z.string().default(""),
        appearance: z.string().default(""),
        personality: z.string().default(""),
        outfit: z.string().default(""),
        items: z.array(z.string()).default([]),
        powers: z.array(z.string()).default([]),
        relationships: z.array(z.object({ name: z.string(), relation: z.string() })).default([]),
      }),
    )
    .default([]),
  locations: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().default(""),
        architecture: z.string().default(""),
        atmosphere: z.string().default(""),
        geography: z.string().default(""),
        lighting: z.string().default(""),
        weather: z.string().default(""),
        objects: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  style: z
    .object({
      name: z.string().default("Original style"),
      lineWeight: z.string().default("bold"),
      inkDensity: z.string().default("dense"),
      colorTreatment: z.string().default("monochrome ink"),
      shading: z.string().default("screentone"),
      lighting: z.string().default("high-contrast chiaroscuro"),
      texture: z.string().default("paper grain"),
      backgroundDetail: z.string().default("detailed"),
      rendering: z.string().default("grounded realistic"),
      motionEffects: z.string().default("speed lines"),
      panelEnergy: z.string().default("kinetic"),
    })
    .default({}),
});
export type BrainResult = z.infer<typeof BrainOut>;

const ChapterOut = z.object({
  title: z.string(),
  synopsis: z.string().default(""),
  scenes: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string().default(""),
        location: z.string().default(""),
        panels: z
          .array(
            z.object({
              shot: z.string().default("medium shot"),
              description: z.string().default(""),
              emotion: z.string().default(""),
              cameraNotes: z.string().default(""),
              characters: z.array(z.string()).default([]),
              sfx: z.string().default(""),
              dialogue: z
                .array(
                  z.object({
                    speaker: z.string().default(""),
                    text: z.string().default(""),
                    kind: z.string().default("speech"),
                  }),
                )
                .default([]),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
  events: z.array(z.object({ title: z.string(), description: z.string().default("") })).default([]),
});
export type ChapterResult = z.infer<typeof ChapterOut>;

const CommandOut = z.object({
  explanation: z.string(),
  understood: z.boolean().default(true),
  operations: z
    .array(
      z.object({
        type: z.enum([
          "updateProject",
          "updateCharacter",
          "updateLocation",
          "updateStyle",
          "updatePanel",
          "addPanel",
          "addTimelineEvent",
          "none",
        ]),
        targetId: z.string().default(""),
        fields: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}),
      }),
    )
    .default([]),
});
export type CommandResult = z.infer<typeof CommandOut>;

/* ------------------------------------------------------------------ */
/* Server functions                                                    */
/* ------------------------------------------------------------------ */

export const aiStatus = createServerFn({ method: "GET" }).handler(async () => ({ configured: hasKey() }));

function toMessage(e: unknown) {
  if (e instanceof AIError) return e.message;
  if (e instanceof z.ZodError) return "The model returned an unexpected shape. Try again.";
  return e instanceof Error ? e.message : "Something went wrong.";
}

export const generateBrain = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ premise: z.string().min(4).max(4000), format: z.enum(["manga", "webtoon"]).default("manga") }).parse(d),
  )
  .handler(async ({ data }): Promise<BrainResult> => {
    try {
      const raw = await chatJSON<unknown>(
        `You are the World Architect agent of Inkline, an AI ${"manga/manhwa"} creation studio.
From a premise you build a complete Story Genome: title, logline, genre, tone, themes, lore, organizations, key items, world rules, a cast of 3-5 characters and 2-4 locations, plus an original Style DNA using only abstract visual attributes.
${ORIGINALITY_RULE}
Respond with JSON only.`,
        `Format: ${data.format}. Premise: ${data.premise}

JSON shape:
{"title":string,"logline":string,"genre":string,"tone":string,"themes":string[],"lore":string,"organizations":string[],"items":string[],"rules":string[],
"characters":[{"name":string,"age":string,"role":string,"appearance":string,"personality":string,"outfit":string,"items":string[],"powers":string[],"relationships":[{"name":string,"relation":string}]}],
"locations":[{"name":string,"description":string,"architecture":string,"atmosphere":string,"geography":string,"lighting":string,"weather":string,"objects":string[]}],
"style":{"name":string,"lineWeight":string,"inkDensity":string,"colorTreatment":string,"shading":string,"lighting":string,"texture":string,"backgroundDetail":string,"rendering":string,"motionEffects":string,"panelEnergy":string}}`,
      );
      return BrainOut.parse(raw);
    } catch (e) {
      throw new Error(toMessage(e));
    }
  });

export const generateChapter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        context: z.string().min(2).max(12000),
        brief: z.string().max(2000).default(""),
        sceneCount: z.number().int().min(1).max(6).default(3),
        panelsPerScene: z.number().int().min(2).max(8).default(4),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<ChapterResult> => {
    try {
      const raw = await chatJSON<unknown>(
        `You are the Director agent of Inkline. You break story state into cinematic chapters.
Rules: vary shot types; dialogue max 14 words per block; SFX are ALL CAPS onomatopoeia; descriptions are directorial notes (posture, light, environment, mood); only cast characters that exist in the provided project state (use their exact names).
${ORIGINALITY_RULE}
Respond with JSON only.`,
        `Project state:
${data.context}

Chapter brief: ${data.brief || "Continue the story naturally from the current state."}
Produce ${data.sceneCount} scenes with about ${data.panelsPerScene} panels each, plus 1-3 timeline events.

JSON shape:
{"title":string,"synopsis":string,"scenes":[{"title":string,"summary":string,"location":string,"panels":[{"shot":string,"description":string,"emotion":string,"cameraNotes":string,"characters":string[],"sfx":string,"dialogue":[{"speaker":string,"text":string,"kind":"speech"|"thought"|"caption"|"shout"}]}]}],"events":[{"title":string,"description":string}]}`,
      );
      return ChapterOut.parse(raw);
    } catch (e) {
      throw new Error(toMessage(e));
    }
  });

export const runCommand = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ command: z.string().min(2).max(1000), context: z.string().max(16000) }).parse(d),
  )
  .handler(async ({ data }): Promise<CommandResult> => {
    try {
      const raw = await chatJSON<unknown>(
        `You are the Co-Director agent of Inkline. You translate a natural-language creative instruction into concrete edit operations against the project state.
Only emit operations you can ground in the provided state — always use real ids from the state. If the instruction cannot be mapped, return understood:false with an empty operations array and explain why.
Never claim to have changed something you did not emit an operation for.
Allowed field keys per type:
- updateProject: title, premise, logline, genre, tone, lore, continuityNotes, themes(string[])
- updateCharacter: name, age, role, appearance, personality, notes, items(string[]), powers(string[]), changes(string[])
- updateLocation: name, description, architecture, atmosphere, lighting, weather, notes
- updateStyle: any style axis (lineWeight, inkDensity, colorTreatment, shading, lighting, texture, backgroundDetail, rendering, motionEffects, panelEnergy, extraNotes)
- updatePanel: shot, description, emotion, cameraNotes, sfx, dialogueText (a single replacement line), speaker
- addPanel: targetId is the scene id; fields shot, description, emotion, sfx
- addTimelineEvent: fields title, description
${ORIGINALITY_RULE}
Respond with JSON only: {"explanation":string,"understood":boolean,"operations":[{"type":string,"targetId":string,"fields":object}]}`,
        `Project state (ids included):
${data.context}

Instruction: ${data.command}`,
      );
      return CommandOut.parse(raw);
    } catch (e) {
      throw new Error(toMessage(e));
    }
  });

export const rewriteDialogue = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ panel: z.string().max(4000), instruction: z.string().max(600).default("Sharpen it.") }).parse(d),
  )
  .handler(async ({ data }) => {
    try {
      return await chatJSON<{ dialogue: { speaker: string; text: string; kind: string }[]; sfx: string }>(
        `You are the Writer agent of Inkline. Rewrite panel dialogue. Max 14 words per block. SFX in ALL CAPS.
Respond with JSON only: {"dialogue":[{"speaker":string,"text":string,"kind":"speech"|"thought"|"caption"|"shout"}],"sfx":string}`,
        `Panel: ${data.panel}\nInstruction: ${data.instruction}`,
      );
    } catch (e) {
      throw new Error(toMessage(e));
    }
  });

/* ------------------------------------------------------------------ */
/* Structured entity extraction                                        */
/* ------------------------------------------------------------------ */

const CharacterOut = z.object({
  name: z.string().default(""),
  age: z.string().default(""),
  role: z.string().default(""),
  appearance: z.string().default(""),
  personality: z.string().default(""),
  outfit: z.string().default(""),
  expressions: z.array(z.string()).default([]),
  poses: z.array(z.string()).default([]),
  items: z.array(z.string()).default([]),
  powers: z.array(z.string()).default([]),
  relationships: z.array(z.object({ name: z.string(), relation: z.string() })).default([]),
  notes: z.string().default(""),
});
export type CharacterResult = z.infer<typeof CharacterOut>;

export const generateCharacter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ description: z.string().min(3).max(4000), context: z.string().max(8000).default("") }).parse(d),
  )
  .handler(async ({ data }): Promise<CharacterResult> => {
    try {
      const raw = await chatJSON<unknown>(
        `You are the Character Designer agent of Inkline. Turn a plain-language description into a canonical character sheet.
Appearance must be a precise, reusable visual description (face shape, hair, eyes, build, height, skin, distinguishing marks) that an artist can redraw identically every time.
${ORIGINALITY_RULE}
Respond with JSON only.`,
        `Project context: ${data.context || "none"}

Description: ${data.description}

JSON shape:
{"name":string,"age":string,"role":string,"appearance":string,"personality":string,"outfit":string,"expressions":string[],"poses":string[],"items":string[],"powers":string[],"relationships":[{"name":string,"relation":string}],"notes":string}`,
      );
      return CharacterOut.parse(raw);
    } catch (e) {
      throw new Error(toMessage(e));
    }
  });

const LocationOut = z.object({
  name: z.string().default(""),
  description: z.string().default(""),
  architecture: z.string().default(""),
  atmosphere: z.string().default(""),
  geography: z.string().default(""),
  lighting: z.string().default(""),
  weather: z.string().default(""),
  objects: z.array(z.string()).default([]),
  notes: z.string().default(""),
});
export type LocationResult = z.infer<typeof LocationOut>;

export const generateLocation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ description: z.string().min(3).max(4000), context: z.string().max(8000).default("") }).parse(d),
  )
  .handler(async ({ data }): Promise<LocationResult> => {
    try {
      const raw = await chatJSON<unknown>(
        `You are the World Architect agent of Inkline. Turn a plain-language description into a canonical location sheet an artist can redraw consistently.
${ORIGINALITY_RULE}
Respond with JSON only.`,
        `Project context: ${data.context || "none"}

Description: ${data.description}

JSON shape:
{"name":string,"description":string,"architecture":string,"atmosphere":string,"geography":string,"lighting":string,"weather":string,"objects":string[],"notes":string}`,
      );
      return LocationOut.parse(raw);
    } catch (e) {
      throw new Error(toMessage(e));
    }
  });
