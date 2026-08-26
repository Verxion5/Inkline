import type {
  Chapter,
  Character,
  DialogueBlock,
  Location,
  Panel,
  Project,
  Scene,
  StyleDNA,
  TimelineEvent,
} from "./types";

export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

export function newCharacter(partial: Partial<Character> = {}): Character {
  return {
    id: uid("chr"),
    name: "Unnamed",
    age: "",
    role: "",
    appearance: "",
    personality: "",
    relationships: [],
    outfits: [],
    activeOutfitId: null,
    expressions: [],
    poses: [],
    items: [],
    powers: [],
    changes: [],
    notes: "",
    ...partial,
  };
}

export function newLocation(partial: Partial<Location> = {}): Location {
  return {
    id: uid("loc"),
    name: "Unnamed place",
    description: "",
    architecture: "",
    atmosphere: "",
    geography: "",
    objects: [],
    lighting: "",
    weather: "",
    notes: "",
    ...partial,
  };
}

export const STYLE_AXES = [
  { key: "lineWeight", label: "Line weight", options: ["hairline", "fine", "balanced", "bold", "brush-heavy"] },
  { key: "inkDensity", label: "Ink density", options: ["airy", "moderate", "dense", "near-solid blacks"] },
  {
    key: "colorTreatment",
    label: "Color treatment",
    options: ["monochrome ink", "duotone", "muted limited palette", "vivid saturated", "pastel wash"],
  },
  { key: "shading", label: "Shading", options: ["screentone", "cross-hatching", "cel shading", "soft gradient", "flat"] },
  {
    key: "lighting",
    label: "Lighting",
    options: ["high-contrast chiaroscuro", "soft ambient", "rim-lit", "backlit haze", "neon practical"],
  },
  { key: "texture", label: "Texture", options: ["clean digital", "paper grain", "grit and speckle", "watercolor bleed"] },
  {
    key: "backgroundDetail",
    label: "Background detail",
    options: ["minimal", "suggestive", "detailed", "hyper-detailed architecture"],
  },
  {
    key: "rendering",
    label: "Anatomy / rendering",
    options: ["stylized-simplified", "grounded realistic", "elongated dramatic", "chibi-adjacent"],
  },
  { key: "motionEffects", label: "Motion effects", options: ["none", "speed lines", "impact bursts", "motion blur"] },
  { key: "panelEnergy", label: "Panel energy", options: ["still and quiet", "measured", "kinetic", "explosive"] },
] as const;

export function newStyle(partial: Partial<StyleDNA> = {}): StyleDNA {
  return {
    id: uid("sty"),
    name: "Ink Noir",
    lineWeight: "bold",
    inkDensity: "dense",
    colorTreatment: "monochrome ink",
    shading: "screentone",
    lighting: "high-contrast chiaroscuro",
    texture: "paper grain",
    backgroundDetail: "detailed",
    rendering: "grounded realistic",
    motionEffects: "speed lines",
    panelEnergy: "kinetic",
    extraNotes: "",
    ...partial,
  };
}

export function newDialogue(partial: Partial<DialogueBlock> = {}): DialogueBlock {
  return { id: uid("dlg"), speaker: "", text: "", kind: "speech", ...partial };
}

export function newPanel(partial: Partial<Panel> = {}): Panel {
  return {
    id: uid("pnl"),
    shot: "medium shot",
    description: "",
    emotion: "",
    cameraNotes: "",
    characterIds: [],
    locationId: null,
    dialogue: [],
    sfx: "",
    promptOverride: "",
    imageUrl: "",
    status: "planned",
    ...partial,
  };
}

export function newScene(partial: Partial<Scene> = {}): Scene {
  return { id: uid("scn"), title: "New scene", summary: "", locationId: null, panels: [], ...partial };
}

export function newChapter(partial: Partial<Chapter> = {}): Chapter {
  return { id: uid("cha"), number: 1, title: "Untitled chapter", synopsis: "", scenes: [], ...partial };
}

export function newEvent(partial: Partial<TimelineEvent> = {}): TimelineEvent {
  return { id: uid("evt"), title: "", description: "", chapterId: null, characterIds: [], ...partial };
}

export function newProject(partial: Partial<Project> = {}): Project {
  const style = newStyle();
  const now = Date.now();
  return {
    id: uid("prj"),
    title: "Untitled project",
    premise: "",
    logline: "",
    genre: "",
    tone: "",
    themes: [],
    lore: "",
    organizations: [],
    items: [],
    rules: [],
    continuityNotes: "",
    format: "manga",
    characters: [],
    locations: [],
    styles: [style],
    activeStyleId: style.id,
    chapters: [],
    timeline: [],
    isDemo: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export const SHOT_TYPES = [
  "establishing wide",
  "wide shot",
  "medium shot",
  "medium close-up",
  "close-up",
  "extreme close-up",
  "over-the-shoulder",
  "low angle",
  "high angle",
  "dutch angle",
  "overhead",
  "silhouette",
  "insert detail",
];
