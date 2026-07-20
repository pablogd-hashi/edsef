# Coding & Security — Reference

Detailed checklists for common stacks. Read only the section you need.

## Next.js / React

### API routes & server actions

- Run auth checks at the start of every handler.
- Set `maxDuration` / body limits for upload routes.
- Use `runtime: "nodejs"` when native modules (Sharp, fs) are required.
- `trustHost: true` only when behind a known reverse proxy; set `AUTH_URL` correctly.
- Middleware: keep public route list explicit and minimal (`/api/ping`, `/api/auth/*`, login).

### Client components

- Never embed secrets in client bundles.
- Treat `canEdit` / role UI as hints only — enforce on server.
- Use `<label>` + file input for mobile upload reliability (iOS Safari).
- CSP: allow `blob:` for media previews if needed; avoid `unsafe-inline` in production when possible.

### Environment

```bash
# Required in production
NODE_ENV=production
AUTH_SECRET=<32+ random bytes>
AUTH_URL=<exact browser URL>
DATABASE_URL=<not committed>
ALLOW_REGISTRATION=false  # private apps
```

## Prisma / PostgreSQL

- Use migrations (`prisma migrate deploy`) in production, not ad-hoc `db push`.
- Soft-delete with `deletedAt`; always filter `deletedAt: null` in queries.
- Index foreign keys and common filter columns.
- Transactions for multi-table writes that must succeed or fail together.
- Never expose raw Prisma errors to clients.

## Authorization patterns

```typescript
// Pattern: authenticate → load resource → authorize → act
const session = await auth();
if (!session?.user?.id) return 401;

const resource = await prisma.resource.findUnique({ where: { id } });
if (!resource) return 404;

const allowed = await accessService.assertParentAccess(session.user.id, resource.childId);
if (!allowed) return 403;

// proceed
```

- Centralize access checks in a service (`assertChildAccess`, `assertParentAccess`).
- Reuse helpers in every route — don’t duplicate role logic.

## File upload security

1. Authenticate and authorize before accepting bytes.
2. Enforce max size per type (image vs video).
3. Write to a dedicated storage root (`STORAGE_PATH`), not `public/`.
4. Generate server-side IDs for filenames; don’t use user filenames on disk.
5. Serve files through authenticated routes, not direct static paths.
6. For exports/downloads, resolve path and verify prefix:

```typescript
const resolved = path.resolve(filePath);
const allowedRoot = path.resolve(STORAGE_ROOT, "exports");
if (!resolved.startsWith(allowedRoot)) return 403;
```

## OWASP-aligned quick map

| Risk | Mitigation |
|------|------------|
| Broken access control | Per-resource server checks, deny by default |
| Cryptographic failures | TLS in prod, strong secrets, bcrypt/argon for passwords |
| Injection | Parameterized queries, schema validation, no shell concat |
| Insecure design | Threat-model uploads, exports, and admin actions early |
| Security misconfiguration | Disable debug, block open registration, minimal ports |
| Vulnerable components | `npm audit`, pin deps, update regularly |
| Auth failures | Rate limit login, secure cookies, session expiry |
| Data integrity failures | Checksums on exports, signed URLs with expiry |
| Logging failures | Log auth events; never log secrets |
| SSRF | Allowlist outbound URLs if fetching user-provided links |

## Git & deployment

- `.gitignore`: `.env`, `storage/`, `backups/`, build artifacts.
- Use `.env.example` / `.env.production.example` with placeholders only.
- Production DB and Redis bound to `127.0.0.1` when co-located on one machine.
- Backups: DB dump + storage archive; test restore periodically.

## Code review prompts

Ask these when reviewing a diff:

1. Can an unauthenticated user hit this route?
2. Can user A access user B’s resource by changing an ID?
3. What happens with empty, huge, or malformed input?
4. Are new env vars documented without real values?
5. Does any log line include tokens, passwords, or file paths with PII?
