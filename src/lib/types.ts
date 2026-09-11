export type ID = string;

export type Relationship = { id: ID; name: string; relation: string };
export type Outfit = { id: ID; name: string; description: string; chapterTag: string };

export type Character = {
  id: ID;
  name: string;
  age: string;
  role: string;
  appearance: string;
  personality: string;
  relationships: Relationship[];
  outfits: Outfit[];
  activeOutfitId: ID | null;
  expressions: string[];
  poses: string[];
  items: string[];
  powers: string[];
  changes: string[];
  notes: string;
};

export type Location = {
  id: ID;
  name: string;
  description: string;
  architecture: string;
  atmosphere: string;
  geography: string;
  objects: string[];
  lighting: string;
  weather: string;
  notes: string;
};

export type StyleDNA = {
  id: ID;
  name: string;
  lineWeight: string;
  inkDensity: string;
  colorTreatment: string;
  shading: string;
  lighting: string;
  texture: string;
  backgroundDetail: string;
  rendering: string;
  motionEffects: string;
  panelEnergy: string;
  extraNotes: string;
};

export type DialogueKind = "speech" | "thought" | "caption" | "shout";
export type DialogueBlock = { id: ID; speaker: string; text: string; kind: DialogueKind };

export type PanelStatus = "planned" | "drawing" | "drawn" | "error";

export type Panel = {
  id: ID;
  shot: string;
  description: string;
  emotion: string;
  cameraNotes: string;
  characterIds: ID[];
  locationId: ID | null;
  dialogue: DialogueBlock[];
  sfx: string;
  promptOverride: string;
  imageUrl: string;
  status: PanelStatus;
  error?: string;
};

export type Scene = {
  id: ID;
  title: string;
  summary: string;
  locationId: ID | null;
  panels: Panel[];
};

export type Chapter = {
  id: ID;
  number: number;
  title: string;
  synopsis: string;
  scenes: Scene[];
};

export type TimelineEvent = {
  id: ID;
  title: string;
  description: string;
  chapterId: ID | null;
  characterIds: ID[];
};

export type ProjectFormat = "manga" | "webtoon";

export type Project = {
  id: ID;
  title: string;
  premise: string;
  logline: string;
  genre: string;
  tone: string;
  themes: string[];
  lore: string;
  organizations: string[];
  items: string[];
  rules: string[];
  continuityNotes: string;
  format: ProjectFormat;
  characters: Character[];
  locations: Location[];
  styles: StyleDNA[];
  activeStyleId: ID | null;
  chapters: Chapter[];
  timeline: TimelineEvent[];
  isDemo: boolean;
  createdAt: number;
  updatedAt: number;
};

export type DB = { projects: Project[]; onboarded: boolean; currentId: ID | null };
