# iCloud inbox — capture from iPhone while the Mac sleeps

Photos stay on your Mac after import. iCloud Drive is only the drop-box so you and your partner can share from anywhere (hospital, park) without opening the app to the public internet.

## One-time setup (Mac)

1. In Finder, open **iCloud Drive** and create a folder named `Memoria Inbox`.
2. Inside it, create one subfolder per child, using their **nickname** (same as in Memoria). Example: `Memoria Inbox/Sofia/`.
3. Right-click `Memoria Inbox` → **Share** → add only your partner.
4. Optional: set an absolute path in `.env`:

```
ICLOUD_INBOX_PATH="/Users/you/Library/Mobile Documents/com~apple~CloudDocs/Memoria Inbox"
```

5. Start the watcher (dev: `npm run inbox:watch`). In production, load the LaunchAgent — see [production-mac.md](./production-mac.md).

The watcher polls every 30 seconds. It skips `.icloud` placeholders until the file has finished downloading.

## From the iPhone

1. In Photos, select one or more photos or videos.
2. **Share → Save to Files → iCloud Drive → Memoria Inbox → (child folder)**.
3. Optional Shortcut: name it **Memoria**, action “Save File” into that child folder. Add it to the share sheet.

When the Mac wakes, files become timeline moments on **this life year**, dated from EXIF (or the file date). Title is the filename — edit it in the yearbook.

Imported files move to `Memoria Inbox/.imported/` so they are not imported twice. Duplicates are skipped by SHA-256 checksum.

## Add Memoria to the Home Screen

On the iPhone, open the app on your home Wi‑Fi (see [remote-access.md](./remote-access.md)), then Safari → **Share → Add to Home Screen**. That icon opens the dashboard; **Open this year** jumps to the timeline.

## Security

- Share the iCloud folder with **only** the two of you.
- Keep `ALLOW_REGISTRATION=false` after both parent accounts exist (invite link in **Family**).
- Do not port-forward port 3000.
- Weekly backup: `npm run prod:backup`.
