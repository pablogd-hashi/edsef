/** Preset theme colors — full hue range, mid saturation so cream/borders stay readable */
export const CHILD_THEME_PRESETS = [
  { name: "Rose", value: "#F472B6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Blush", value: "#FB7185" },
  { name: "Coral", value: "#E11D48" },
  { name: "Peach", value: "#F97316" },
  { name: "Amber", value: "#D97706" },
  { name: "Gold", value: "#CA8A04" },
  { name: "Cocoa", value: "#B45309" },
  { name: "Sage", value: "#4D7C5A" },
  { name: "Forest", value: "#15803D" },
  { name: "Teal", value: "#0D9488" },
  { name: "Sky", value: "#0284C7" },
  { name: "Blue", value: "#2563EB" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Fuchsia", value: "#D946EF" },
  { name: "Orchid", value: "#E879F9" },
  { name: "Purple", value: "#A855F7" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Lavender", value: "#C084FC" },
  { name: "Slate", value: "#475569" },
] as const;

export const DEFAULT_THEME_COLOR = "#D946EF";

export const THEME_HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/** Accept #RGB or #RRGGBB (with or without #). Returns #RRGGBB or null. */
export function normalizeThemeHex(value: string): string | null {
  let v = value.trim();
  if (!v.startsWith("#")) v = `#${v}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  if (!THEME_HEX_RE.test(v)) return null;
  return `#${v.slice(1).toUpperCase()}`;
}

function clamp(n: number, min = 0, max = 255) {
  return Math.round(Math.min(max, Math.max(min, n)));
}

export function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  if (h.length !== 6) return { r: 217, g: 70, b: 239 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Mix color toward white (amount 0–1) */
export function lighten(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  return toHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

/** Mix color toward black (amount 0–1) */
export function darken(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/** CSS custom properties derived from a child's theme color */
export function themeToCssVars(themeColor: string): Record<string, string> {
  const accent = themeColor;
  const accentLight = lighten(themeColor, 0.35);
  const accentDark = darken(themeColor, 0.22);
  const cream = lighten(themeColor, 0.92);
  const border = lighten(themeColor, 0.82);
  const borderLight = lighten(themeColor, 0.9);

  return {
    ["--accent" as string]: accent,
    ["--accent-light" as string]: accentLight,
    ["--accent-dark" as string]: accentDark,
    ["--cream" as string]: cream,
    ["--border" as string]: border,
    ["--border-light" as string]: borderLight,
  };
}
