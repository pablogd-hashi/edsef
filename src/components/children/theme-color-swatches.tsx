"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHILD_THEME_PRESETS, normalizeThemeHex } from "@/lib/theme/colors";

export function ThemeColorSwatches({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  const [hexDraft, setHexDraft] = useState(value);
  const selected = value.toLowerCase();
  const isPreset = CHILD_THEME_PRESETS.some(
    (preset) => preset.value.toLowerCase() === selected
  );

  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setHexDraft(value);
  }

  function commit(raw: string) {
    const next = normalizeThemeHex(raw);
    if (!next || next.toLowerCase() === selected) return;
    onChange(next);
  }

  const pickerValue = normalizeThemeHex(value)?.toLowerCase() ?? "#d946ef";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CHILD_THEME_PRESETS.map((preset) => {
          const isActive = selected === preset.value.toLowerCase();
          return (
            <button
              key={preset.value}
              type="button"
              disabled={disabled}
              title={preset.name}
              onClick={() => onChange(preset.value)}
              className={cn(
                "relative h-9 w-9 rounded-full border-2 transition-all touch-manipulation",
                isActive
                  ? "border-foreground scale-110 shadow-md"
                  : "border-white shadow-sm hover:scale-105"
              )}
              style={{ backgroundColor: preset.value }}
            >
              {isActive && (
                <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-9 shrink-0 cursor-pointer">
          <span className="sr-only">Custom color</span>
          <input
            type="color"
            disabled={disabled}
            value={pickerValue}
            onChange={(e) => commit(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed text-[10px] font-medium",
              isPreset
                ? "border-border text-muted"
                : "border-foreground scale-110 shadow-md text-white"
            )}
            style={{ backgroundColor: isPreset ? "transparent" : value }}
            aria-hidden
          >
            {isPreset ? "+" : ""}
          </span>
        </label>
        <input
          type="text"
          spellCheck={false}
          disabled={disabled}
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={() => commit(hexDraft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(hexDraft);
            }
          }}
          aria-label="Hex color"
          placeholder="#D946EF"
          className="w-28 rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        />
        <span className="text-xs text-muted">Custom</span>
      </div>
    </div>
  );
}
