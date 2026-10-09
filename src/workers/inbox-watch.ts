/**
 * Poll an iCloud Drive (or local) inbox folder and import new photos
 * into each child's current life-year timeline.
 *
 *   ICLOUD_INBOX_PATH="~/Library/Mobile Documents/com~apple~CloudDocs/Memoria Inbox"
 *   npm run inbox:watch
 */
import fs from "fs";
import os from "os";
import path from "path";
import { resolveInboxPath } from "@/lib/inbox/paths";
import { scanInbox } from "@/lib/inbox/scan";

// Two watchers (LaunchAgent + a manual run) would import the same file twice.
const LOCK = path.join(os.tmpdir(), "memoria-inbox-watch.pid");
acquireLock();

function acquireLock() {
  try {
    const pid = Number(fs.readFileSync(LOCK, "utf8"));
    if (pid && pid !== process.pid) {
      process.kill(pid, 0); // throws if that process is gone
      console.error(`[inbox] another watcher is running (pid ${pid}); exiting`);
      process.exit(0);
    }
  } catch {
    // no lock, or a stale one from a crashed watcher
  }
  fs.writeFileSync(LOCK, String(process.pid));
}

const INTERVAL_MS = Number(process.env.ICLOUD_INBOX_POLL_MS ?? 30_000);

async function tick() {
  const inboxPath = resolveInboxPath();
  try {
    const results = await scanInbox(inboxPath);
    for (const result of results) {
      if (result.status === "imported") {
        console.log(`[inbox] imported ${result.file}`);
      } else if (result.status === "error") {
        console.error(`[inbox] ${result.file}: ${result.reason}`);
      } else if (result.status === "unassigned") {
        console.warn(`[inbox] ${result.file}: ${result.reason}`);
      }
    }
  } catch (error) {
    console.error("[inbox] scan failed", error);
  }
}

console.log(`Memoria inbox watcher → ${resolveInboxPath()}`);
console.log(`Polling every ${INTERVAL_MS / 1000}s`);

void tick();
const timer = setInterval(() => {
  void tick();
}, INTERVAL_MS);

function shutdown() {
  clearInterval(timer);
  try {
    if (fs.readFileSync(LOCK, "utf8") === String(process.pid)) fs.unlinkSync(LOCK);
  } catch {
    // already gone
  }
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
