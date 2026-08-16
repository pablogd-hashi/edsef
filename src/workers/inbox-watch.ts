/**
 * Poll an iCloud Drive (or local) inbox folder and import new photos
 * into each child's current life-year timeline.
 *
 *   ICLOUD_INBOX_PATH="~/Library/Mobile Documents/com~apple~CloudDocs/Memoria Inbox"
 *   npm run inbox:watch
 */
import { resolveInboxPath } from "@/lib/inbox/paths";
import { scanInbox } from "@/lib/inbox/scan";

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
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
