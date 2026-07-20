import { parseMonthName } from "./months";
import type {
  ImportMilestone,
  ImportMusic,
  ImportParentNote,
  ImportPreview,
  ImportStory,
  ImportTimelineItem,
  ImportVideo,
  TimelineCategory,
} from "./types";

const URL_RE = /https?:\/\/[^\s)]+/gi;
const PAGE_MARKER_RE = /^--\s*\d+\s+of\s+\d+\s*--$/i;
const YEAR_HEADER_RE = /^(\d{4})\s*[-–—]/;
const NUMBERED_MILESTONE_RE = /^(\d+)\.\s+(.+)$/;
const BULLET_RE = /^[-*•⁃]\s*(.+)$/;

const MUSIC_HEADER_RE = /musica que te gustaba|música que te gustaba|music you liked|favorite music/i;
const ACHIEVEMENTS_HEADER_RE = /lo que lograste|what you achieved|achievements this year/i;
const SUMMARY_HEADER_RE = /^un resumen|^a summary/i;
const BEFORE_BIRTH_RE = /antes que.*nacier|before you were born|before.*born/i;
const DURING_YEAR_RE = /en este a[nñ]o|this year|pasaron.*este a[nñ]o/i;
const PARENT_NOTES_RE = /notas de mam|mom'?s? notes|algunas notas|parent notes|primer a[nñ]o con/i;
const VIDEO_HEADER_RE = /segundo de cada|video|videito|1se\b/i;
const STORY_TITLE_HINTS = /dia que naciste|day you were born|el dia que|birth story/i;

type SectionKind =
  | "summary"
  | "milestones"
  | "music"
  | "story"
  | "parent_notes"
  | "parents_before"
  | "parents_during"
  | "video"
  | "skip";

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
    .replace(/●/g, "\n- ")
    .replace(/[⁃•]/g, "-")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isLikelyStoryTitle(line: string): boolean {
  if (line.length > 90 || line.length < 4) return false;
  if (BULLET_RE.test(line) || NUMBERED_MILESTONE_RE.test(line)) return false;
  if (URL_RE.test(line)) return false;
  if (parseMonthName(line)) return false;
  if (YEAR_HEADER_RE.test(line)) return false;
  if (MUSIC_HEADER_RE.test(line) || ACHIEVEMENTS_HEADER_RE.test(line)) return false;
  if (STORY_TITLE_HINTS.test(line)) return true;
  return line.split(/\s+/).length <= 8 && !line.endsWith(".");
}

function shouldMergeLines(previous: string, current: string): boolean {
  if (
    YEAR_HEADER_RE.test(current) ||
    parseMonthName(current) ||
    NUMBERED_MILESTONE_RE.test(current) ||
    BULLET_RE.test(current) ||
    MUSIC_HEADER_RE.test(current) ||
    ACHIEVEMENTS_HEADER_RE.test(current)
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

function splitLines(text: string): string[] {
  const raw = normalizeText(text)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !PAGE_MARKER_RE.test(l));
  return mergeBrokenLines(raw);
}

function detectYearRange(text: string, title?: string): { start: number; end: number } | undefined {
  if (title) {
    const rangeInTitle = title.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
    if (rangeInTitle) {
      return { start: Number(rangeInTitle[1]), end: Number(rangeInTitle[2]) };
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

function detectSubtitle(lines: string[]): string | undefined {
  const second = lines[1];
  if (!second || second.length > 60 || BULLET_RE.test(second)) return undefined;
  if (YEAR_HEADER_RE.test(second) || URL_RE.test(second)) return undefined;
  return second;
}

function parseMusicLine(line: string): { title: string; artist?: string } {
  const cleaned = line.replace(/^[-*]\s*/, "").trim();
  const colonParts = cleaned.split(":");
  if (colonParts.length >= 2) {
    return {
      title: colonParts[0].trim(),
      artist: colonParts.slice(1).join(":").trim() || undefined,
    };
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

function classifyYearHeader(line: string): SectionKind {
  if (PARENT_NOTES_RE.test(line)) return "parent_notes";
  if (BEFORE_BIRTH_RE.test(line)) return "parents_before";
  if (DURING_YEAR_RE.test(line)) return "parents_during";
  if (/pasaron|happened/i.test(line) && !BEFORE_BIRTH_RE.test(line)) return "parents_during";
  return "skip";
}

function addTimeline(
  target: ImportTimelineItem[],
  title: string,
  year: number,
  month: number,
  category: TimelineCategory,
  description?: string
) {
  const clean = title.slice(0, 200).trim();
  if (!clean) return;
  target.push({ title: clean, description, month, year, category });
}

export function parseNotesDocument(text: string): ImportPreview {
  const lines = splitLines(text);
  const preview: ImportPreview = {
    summary: { highlights: [] },
    milestones: [],
    stories: [],
    music: [],
    parentsBeforeBirth: [],
    parentsDuringYear: [],
    parentNotes: [],
    videos: [],
  };

  preview.detectedTitle = detectTitle(lines);
  preview.summary.subtitle = detectSubtitle(lines);
  preview.yearRange = detectYearRange(text, preview.detectedTitle);

  const state: ParserState = {
    currentYear: preview.yearRange?.start ?? null,
    currentMonth: null,
    section: "summary",
    parentAuthor: "Mom",
  };

  let storyTitle: string | null = null;
  let storyParagraphs: string[] = [];
  let pendingVideoTitle: string | null = null;

  const flushStory = () => {
    const content = storyParagraphs.join("\n\n").trim();
    if (storyTitle && content.length >= 60) {
      preview.stories.push({ title: storyTitle, content });
    }
    storyTitle = null;
    storyParagraphs = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const urls = extractUrls(line);
    const lineWithoutUrls = stripUrls(line);

    if (SUMMARY_HEADER_RE.test(line)) {
      state.section = "summary";
      continue;
    }

    if (ACHIEVEMENTS_HEADER_RE.test(line)) {
      flushStory();
      state.section = "milestones";
      continue;
    }

    if (MUSIC_HEADER_RE.test(line)) {
      flushStory();
      state.section = "music";
      continue;
    }

    if (VIDEO_HEADER_RE.test(line) && !URL_RE.test(line)) {
      flushStory();
      state.section = "video";
      pendingVideoTitle = lineWithoutUrls || "Video";
      continue;
    }

    const yearMatch = line.match(YEAR_HEADER_RE);
    if (yearMatch) {
      flushStory();
      state.currentYear = Number(yearMatch[1]);
      state.section = classifyYearHeader(line);
      state.parentAuthor = inferParentAuthor(line);
      continue;
    }

    const month = parseMonthName(line);
    if (month) {
      flushStory();
      state.currentMonth = month;
      continue;
    }

    for (const url of urls) {
      if (state.section === "video" || /drive\.google|youtube|youtu\.be/i.test(url)) {
        preview.videos.push({
          title: pendingVideoTitle ?? (lineWithoutUrls.slice(0, 120) || "Video"),
          url,
        });
        pendingVideoTitle = null;
        continue;
      }
    }

    const milestoneMatch = line.match(NUMBERED_MILESTONE_RE);
    if (milestoneMatch && (state.section === "milestones" || state.section === "summary")) {
      flushStory();
      const body = milestoneMatch[2].trim();
      const colon = body.indexOf(":");
      const title = colon > 0 ? body.slice(0, colon).trim() : body;
      const description = colon > 0 ? body.slice(colon + 1).trim() : undefined;
      preview.milestones.push({ title, description });
      state.section = "milestones";
      continue;
    }

    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      flushStory();
      const content = bulletMatch[1].trim();
      const year = state.currentYear ?? preview.yearRange?.start ?? new Date().getFullYear();
      const month = state.currentMonth ?? 1;

      switch (state.section) {
        case "music":
          preview.music.push(parseMusicLine(content));
          break;
        case "parent_notes":
          preview.parentNotes.push({
            author: state.parentAuthor,
            content,
            month,
            year,
          });
          break;
        case "parents_before":
          addTimeline(preview.parentsBeforeBirth, content, year, month, "PARENTS_BEFORE_BIRTH");
          break;
        case "parents_during":
          addTimeline(preview.parentsDuringYear, content, year, month, "PARENTS_DURING_YEAR");
          break;
        case "summary":
          preview.summary.highlights = [...(preview.summary.highlights ?? []), content];
          break;
        default:
          if (state.currentMonth) {
            addTimeline(preview.parentsDuringYear, content, year, month, "PARENTS_DURING_YEAR");
          } else {
            preview.summary.highlights = [...(preview.summary.highlights ?? []), content];
          }
      }
      continue;
    }

    if (isLikelyStoryTitle(line) && !storyTitle) {
      const nextLine = lines[i + 1] ?? "";
      if (nextLine.length > 40) {
        flushStory();
        state.section = "story";
        storyTitle = line;
        continue;
      }
    }

    if (storyTitle && lineWithoutUrls.length > 0) {
      storyParagraphs.push(lineWithoutUrls);
      continue;
    }

    if (
      state.section === "summary" &&
      lineWithoutUrls.length > 20 &&
      !URL_RE.test(line) &&
      !SUMMARY_HEADER_RE.test(line)
    ) {
      preview.summary.context = preview.summary.context
        ? `${preview.summary.context}\n${lineWithoutUrls}`
        : lineWithoutUrls;
    }
  }

  flushStory();

  if (preview.music.length > 0) {
    preview.summary.highlights = preview.summary.highlights ?? [];
  }

  return preview;
}
