#!/usr/bin/env bash
# Install (or refresh) the macOS LaunchAgents that keep Memoria running:
#   com.memoria          app server, restarted if it crashes
#   com.memoria.inbox    iCloud inbox watcher (only when ICLOUD_INBOX_PATH is set)
#   com.memoria.backup   nightly backup at 03:30 (runs on wake if the Mac was asleep)
#
#   ./scripts/prod/install-launchagents.sh            install / update
#   ./scripts/prod/install-launchagents.sh --remove   uninstall
#
# Paths are filled in from this checkout — no plist editing needed.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

AGENTS="$HOME/Library/LaunchAgents"
LOGS="$HOME/Library/Logs"
DOMAIN="gui/$(id -u)"
mkdir -p "$AGENTS" "$LOGS"

unload() {
  launchctl bootout "$DOMAIN/$1" 2>/dev/null || true
}

if [[ "${1:-}" == "--remove" ]]; then
  for label in com.memoria com.memoria.inbox com.memoria.backup; do
    unload "$label"
    rm -f "$AGENTS/$label.plist"
  done
  echo "✓ LaunchAgents removed"
  exit 0
fi

load_env

# LaunchAgents don't load your shell profile (nvm, etc.), so pin the Node used now.
NODE_BIN="$(command -v node || true)"
[[ -n "$NODE_BIN" ]] || die "node not found on PATH"
NODE_MAJOR="$("$NODE_BIN" -p 'process.versions.node.split(".")[0]')"
(( NODE_MAJOR >= 20 )) || die "Node $NODE_MAJOR is too old (need 20+). Switch with nvm and re-run."
NODE_DIR="$(dirname "$NODE_BIN")"

# write_agent <label> <script> <extra plist keys>
write_agent() {
  local label="$1" script="$2" extra="$3"
  cat > "$AGENTS/$label.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$label</string>
  <key>WorkingDirectory</key>
  <string>$ROOT_DIR</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$ROOT_DIR/scripts/prod/$script</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$NODE_DIR:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
$extra
  <key>StandardOutPath</key>
  <string>$LOGS/$label.log</string>
  <key>StandardErrorPath</key>
  <string>$LOGS/$label.log</string>
</dict>
</plist>
PLIST
  unload "$label"
  launchctl bootstrap "$DOMAIN" "$AGENTS/$label.plist"
  log "Installed $label (log: ~/Library/Logs/$label.log)"
}

# ThrottleInterval: a crashing app (e.g. failed build) retries every 60 s instead of in a tight loop.
write_agent com.memoria start.sh "  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>60</integer>"

if [[ -n "${ICLOUD_INBOX_PATH:-}" ]]; then
  write_agent com.memoria.inbox inbox-watch.sh "  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>60</integer>"
else
  unload com.memoria.inbox
  rm -f "$AGENTS/com.memoria.inbox.plist"
  log "ICLOUD_INBOX_PATH not set — inbox watcher not installed"
fi

write_agent com.memoria.backup backup.sh "  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>3</integer>
    <key>Minute</key>
    <integer>30</integer>
  </dict>"

echo
echo "✓ Memoria will start at login, restart if it stops, and back up every night."
echo "  Also enable: Docker Desktop → Settings → General → Start Docker Desktop when you sign in."
