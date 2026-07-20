import { parseMonthName } from "./months";
import type {
  ImportLink,
  ImportMilestone,
  ImportMusic,
  ImportParentNote,
  ImportPreview,
  ImportStory,
  ImportTimelineItem,
} from "./types";

const URL_RE = /https?:\/\/[^\s)]+/gi;
const PAGE_MARKER_RE = /^--\s*\d+\s+of\s+\d+\s*--$/i;
const YEAR_HEADER_RE = /^(\d{4})\s*[-–—]/;
const NUMBERED_MILESTONE_RE = /^(\d+)\.\s+(.+)$/;
const BULLET_RE = /^[-*•⁃]\s*(.+)$/;
const MUSIC_HEADER_RE = /musica|música|music\s+you\s+liked|favorite\s+music/i;

type SectionKind = "general" | "music" | "parent_notes" | "monthly";

interface ParserState {
  currentYear: number | null;
  currentMonth: number | null;
  section: SectionKind;
  parentAuthor: string;
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[●⁃•]/g, "-")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLines(text: string): string[] {
  const raw = normalizeText(text)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !PAGE_MARKER_RE.test(l));
  return mergeBrokenLines(raw);
}

function isLikelyStoryTitle(line: string): boolean {
  if (line.length > 90 || line.length < 4) return false;
  if (BULLET_RE.test(line) || NUMBERED_MILESTONE_RE.test(line)) return false;
  if (URL_RE.test(line)) return false;
  if (parseMonthName(line)) return false;
  if (YEAR_HEADER_RE.test(line)) return false;
  if (MUSIC_HEADER_RE.test(line)) return false;
  return true;
}

function shouldMergeLines(previous: string, current: string): boolean {
  if (
    YEAR_HEADER_RE.test(current) ||
    parseMonthName(current) ||
    NUMBERED_MILESTONE_RE.test(current) ||
    BULLET_RE.test(current) ||
    MUSIC_HEADER_RE.test(current)
  ) {
    return false;
  }

  if (YEAR_HEADER_RE.test(previous) && previous.includes("(") && !previous.includes(")")) {
    return true;
  }

  if (BULLET_RE.test(previous) && !/[.!?)"']\s*$/.test(previous)) {
    if (isLikelyStoryTitle(current) || YEAR_HEADER_RE.test(current)) return false;
    return true;
  }

  if (
    previous.length > 50 &&
    !BULLET_RE.test(previous) &&
    !NUMBERED_MILESTONE_RE.test(previous) &&
    /^[a-záéíóúñ]/.test(current)
  ) {
    return true;
  }

  return false;
}

function mergeBrokenLines(lines: string[]): string[] {
  const merged: string[] = [];
  for (const line of lines) {
    if (merged.length > 0 && shouldMergeLines(merged[merged.length - 1], line)) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${line}`;
    } else {
      merged.push(line);
    }
  }
  return merged;
}

function detectYearRange(text: string, title?: string): { start: number; end: number } | undefined {
  if (title) {
    const rangeInTitle = title.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
    if (rangeInTitle) {
      return { start: Number(rangeInTitle[1]), end: Number(rangeInTitle[2]) };
    }
    const singleYear = title.match(/\b(19|20)\d{2}\b/);
    if (singleYear) {
      const y = Number(singleYear[0]);
      return { start: y, end: y };
    }
  }

  const headerYears = [...text.matchAll(/^(\d{4})\s*[-–—]/gm)].map((m) => Number(m[1]));
  if (headerYears.length > 0) {
    return { start: Math.min(...headerYears), end: Math.max(...headerYears) };
  }

  return undefined;
}

function detectTitle(lines: string[]): string | undefined {
  const first = lines[0];
  if (!first || first.length > 80) return undefined;
  if (YEAR_HEADER_RE.test(first) || URL_RE.test(first)) return undefined;
  return first;
}

function parseMusicLine(line: string): { title: string; artist?: string } {
  const cleaned = line.replace(/^[-*]\s*/, "").trim();
  const colonParts = cleaned.split(":");
  if (colonParts.length >= 2) {
    const title = colonParts[0].trim();
    const artist = colonParts.slice(1).join(":").trim();
    return { title, artist: artist || undefined };
  }
  const dashParts = cleaned.split(/\s[-–—]\s/);
  if (dashParts.length >= 2) {
    return { title: dashParts[0].trim(), artist: dashParts.slice(1).join(" - ").trim() };
  }
  return { title: cleaned };
}

function extractUrls(line: string): string[] {
  return [...line.matchAll(URL_RE)].map((m) => m[0].replace(/[.,;]+$/, ""));
}

function stripUrls(line: string): string {
  return line.replace(URL_RE, "").trim();
}

function inferParentAuthor(header: string): string {
  if (/mam[aá]|mom|mother/i.test(header)) return "Mom";
  if (/pap[aá]|dad|father/i.test(header)) return "Dad";
  return "Parent";
}

function addTimelineItem(
  items: ImportTimelineItem[],
  title: string,
  year: number,
  month: number,
  description?: string
) {
  const cleanTitle = title.slice(0, 200);
  if (!cleanTitle) return;
  items.push({ title: cleanTitle, description, month, year });
}

export function parseNotesDocument(text: string): ImportPreview {
  const lines = splitLines(text);
  const preview: ImportPreview = {
    summary: { highlights: [] },
    milestones: [],
    stories: [],
    music: [],
    timeline: [],
    parentNotes: [],
    links: [],
  };

  preview.detectedTitle = detectTitle(lines);
  preview.yearRange = detectYearRange(text, preview.detectedTitle);

  const state: ParserState = {
    currentYear: preview.yearRange?.start ?? null,
    currentMonth: null,
    section: "general",
    parentAuthor: "Parent",
  };

  let storyTitle: string | null = null;
  let storyParagraphs: string[] = [];
  let summaryBullets: string[] = [];

  const flushStory = () => {
    const content = storyParagraphs.join("\n\n").trim();
    if (storyTitle && content.length >= 80) {
      preview.stories.push({ title: storyTitle, content });
    }
    storyTitle = null;
    storyParagraphs = [];
  };

  const flushSummaryBullets = () => {
    if (summaryBullets.length === 0) return;
    const joined = summaryBullets.join("\n");
    if (!preview.summary.context) {
      preview.summary.context = joined;
    } else {
      preview.summary.highlights = [...(preview.summary.highlights ?? []), ...summaryBullets];
    }
    summaryBullets = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const urls = extractUrls(line);
    const lineWithoutUrls = stripUrls(line);

    for (const url of urls) {
      preview.links.push({ label: lineWithoutUrls || undefined, url });
    }

    if (MUSIC_HEADER_RE.test(line)) {
      flushStory();
      flushSummaryBullets();
      state.section = "music";
      continue;
    }

    const yearMatch = line.match(YEAR_HEADER_RE);
    if (yearMatch) {
      flushStory();
      flushSummaryBullets();
      state.currentYear = Number(yearMatch[1]);
      state.section = /nota|notes|mam[aá]|mom|journal/i.test(line)
        ? "parent_notes"
        : /pasaron|happened|events/i.test(line)
          ? "monthly"
          : "general";
      state.parentAuthor = inferParentAuthor(line);
      continue;
    }

    const month = parseMonthName(line);
    if (month) {
      flushStory();
      state.currentMonth = month;
      if (state.section === "general") state.section = "monthly";
      continue;
    }

    const milestoneMatch = line.match(NUMBERED_MILESTONE_RE);
    if (milestoneMatch) {
      flushStory();
      const body = milestoneMatch[2].trim();
      const [title, ...rest] = body.split(/[:.]\s+/, 2);
      preview.milestones.push({
        title: title.trim(),
        description: rest.join(". ").trim() || undefined,
      });
      continue;
    }

    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      flushStory();
      const content = bulletMatch[1].trim();
      const year = state.currentYear ?? new Date().getFullYear();
      const month = state.currentMonth ?? 1;

      if (state.section === "music") {
        const parsed = parseMusicLine(content);
        preview.music.push(parsed);
        continue;
      }

      if (state.section === "parent_notes") {
        preview.parentNotes.push({
          author: state.parentAuthor,
          content,
          month,
          year,
        });
        continue;
      }

      if (state.section === "monthly" || state.currentMonth) {
        addTimelineItem(preview.timeline, content, year, month);
        continue;
      }

      summaryBullets.push(content);
      continue;
    }

    // Long narrative block detection
    if (isLikelyStoryTitle(line) && !storyTitle) {
      const nextLine = lines[i + 1] ?? "";
      if (nextLine.length > 60 || /^[A-ZÁÉÍÓÚÑ]/.test(nextLine)) {
        flushStory();
        state.section = "general";
        storyTitle = line;
        continue;
      }
    }

    if (storyTitle && lineWithoutUrls.length > 0) {
      storyParagraphs.push(lineWithoutUrls);
      continue;
    }

    if (
      lineWithoutUrls.length > 120 &&
      !URL_RE.test(line) &&
      state.section === "general" &&
      preview.stories.length === 0
    ) {
      flushStory();
      storyTitle = "Imported story";
      storyParagraphs.push(lineWithoutUrls);
    }
  }

  flushStory();
  flushSummaryBullets();

  if (preview.music.length > 0) {
    preview.summary.favoriteMusic = preview.music
      .map((m) => (m.artist ? `${m.title} — ${m.artist}` : m.title))
      .join("\n");
  }

  if (preview.milestones.length > 0 && !preview.summary.highlights?.length) {
    preview.summary.highlights = preview.milestones.map((m) => m.title);
  }

  // Standalone link lines become timeline items
  for (const link of preview.links) {
    if (preview.timeline.some((t) => t.description?.includes(link.url))) continue;
    if (link.label && link.label.length > 80) continue;
    const year = preview.yearRange?.start ?? new Date().getFullYear();
    addTimelineItem(
      preview.timeline,
      link.label?.slice(0, 120) || "Imported link",
      year,
      1,
      link.url
    );
  }

  return preview;
}
