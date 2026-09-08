import {
  BACKGROUNDS,
  COLOR,
  LINEWORK,
  SHADING,
  applyPreset,
  presetsFor,
  type ArtSettings,
  type BackgroundDetail,
  type ColorTreatment,
  type Format,
  type Linework,
  type QualityLevel,
  type Shading,
} from "@/lib/artDirection";

type Props = {
  settings: ArtSettings;
  onChange: (s: ArtSettings) => void;
  compact?: boolean;
};

const label = "font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground";
const select =
  "w-full border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary";

function Slider({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className={label}>
        {name} · {value}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--primary)]"
      />
    </label>
  );
}

export function ArtInspector({ settings, onChange, compact = false }: Props) {
  const set = (patch: Partial<ArtSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="space-y-4">
      <div>
        <span className={label}>Format</span>
        <div className="mt-1 flex gap-1">
          {(["manga", "webtoon"] as Format[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChange(applyPreset({ ...settings, format: f }, presetsFor(f)[0]!.id))}
              className={`flex-1 border-2 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
                settings.format === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {f === "manga" ? "Manga · B/W" : "Manhwa · Color"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={label}>Original style preset</span>
        <div className="mt-1 grid gap-1">
          {presetsFor(settings.format).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(applyPreset(settings, p.id))}
              className={`border px-2 py-1.5 text-left transition ${
                settings.presetId === p.id ? "border-primary bg-primary/10" : "border-border hover:border-foreground"
              }`}
            >
              <div className="font-display text-base italic leading-none text-foreground">{p.name}</div>
              <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{p.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>Linework</span>
            <select
              className={select}
              value={settings.linework}
              onChange={(e) => set({ linework: e.target.value as Linework })}
            >
              {LINEWORK.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Shading</span>
            <select
              className={select}
              value={settings.shading}
              onChange={(e) => set({ shading: e.target.value as Shading })}
            >
              {SHADING.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Color</span>
            <select
              className={select}
              value={settings.colorTreatment}
              onChange={(e) => set({ colorTreatment: e.target.value as ColorTreatment })}
            >
              {COLOR.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Backgrounds</span>
            <select
              className={select}
              value={settings.backgroundDetail}
              onChange={(e) => set({ backgroundDetail: e.target.value as BackgroundDetail })}
            >
              {BACKGROUNDS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="space-y-3">
        <Slider name="Cinematic" value={settings.cinematicIntensity} onChange={(n) => set({ cinematicIntensity: n })} />
        <Slider
          name="Expressiveness"
          value={settings.facialExpressiveness}
          onChange={(n) => set({ facialExpressiveness: n })}
        />
        <Slider name="Action" value={settings.actionIntensity} onChange={(n) => set({ actionIntensity: n })} />
      </div>

      <div className="flex items-end gap-3">
        <label className="flex-1">
          <span className={label}>Quality</span>
          <select
            className={select}
            value={settings.quality}
            onChange={(e) => set({ quality: e.target.value as QualityLevel })}
          >
            <option value="draft">draft — fastest</option>
            <option value="standard">standard</option>
            <option value="high">high detail</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-1.5">
          <input
            type="checkbox"
            checked={settings.review}
            onChange={(e) => set({ review: e.target.checked })}
            className="accent-[var(--primary)]"
          />
          <span className={label}>Auto QA</span>
        </label>
      </div>
    </div>
  );
}
