import os from "os";
import path from "path";

export const IMPORTED_DIR = ".imported";
export const UNASSIGNED_DIR = "unassigned";

export function resolveInboxPath(override?: string): string {
  const raw = override ?? process.env.ICLOUD_INBOX_PATH;
  if (raw && raw.trim()) {
    return expandHome(raw.trim());
  }
  return path.join(
    os.homedir(),
    "Library/Mobile Documents/com~apple~CloudDocs/Memoria Inbox"
  );
}

export function expandHome(input: string): string {
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return path.resolve(input);
}

export function folderSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isPlaceholderName(filename: string): boolean {
  const base = path.basename(filename);
  if (base.startsWith(".")) return true;
  if (base.endsWith(".icloud")) return true;
  if (base === "Icon\r") return true;
  return false;
}

export function titleFromFilename(filename: string): string {
  const base = path.basename(filename).replace(/\.[^.]+$/, "").trim();
  return base || "Untitled";
}
