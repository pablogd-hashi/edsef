/** Preset theme colors (pink & purple family) */
export const CHILD_THEME_PRESETS = [
  { name: "Rose", value: "#F472B6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Blush", value: "#FB7185" },
  { name: "Fuchsia", value: "#D946EF" },
  { name: "Orchid", value: "#E879F9" },
  { name: "Purple", value: "#A855F7" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Lavender", value: "#C084FC" },
] as const;

export const DEFAULT_THEME_COLOR = "#D946EF";

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, n));
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
