---
name: coding-security-best-practices
description: Applies coding quality and application security best practices when writing, reviewing, or refactoring code. Use when implementing features, fixing bugs, handling auth/secrets/uploads/APIs, reviewing PRs, or when the user asks for secure coding, security review, or code quality guidance.
---

# Coding & Security Best Practices

Apply on every implementation and review. Prefer the smallest correct change; security is part of correctness, not a separate pass.

## Coding principles

1. **Minimize scope** — Smallest diff that solves the task. No drive-by refactors or unrelated edits.
2. **Match conventions** — Read surrounding code first; reuse existing abstractions, naming, and patterns.
3. **Right-sized abstractions** — No one-line helpers or premature frameworks. Extract only when reuse is real.
4. **Explicit over clever** — Readable control flow beats dense one-liners.
5. **Useful tests only** — Test behavior and boundaries, not implementation trivia or obvious getters.
6. **Fail clearly** — Return meaningful errors to callers; log server-side detail without leaking internals to clients.

## Security principles

### Secrets & configuration

- Never commit secrets (API keys, passwords, `AUTH_SECRET`, DB URLs with real creds).
- Load from environment; document required vars in `.env.example` only (placeholder values).
- Rotate anything that was ever committed or logged.
- Use strong random secrets (`openssl rand -base64 32` or equivalent).

### Authentication & authorization

- **Authenticate** before handling protected resources.
- **Authorize** per action and per resource (not just “logged in”).
- Check ownership/role on the server — never trust client flags or hidden form fields.
- Use least privilege: default deny; grant only what the role needs.
- Session cookies: `HttpOnly`, `Secure` in production, sensible `SameSite`.
- Disable public registration when the app is private (`ALLOW_REGISTRATION=false` pattern).

### Input validation

- Validate all external input at the boundary (API body, query, headers, uploads).
- Use a schema library (e.g. Zod) — parse, don’t cast.
- Reject unknown fields when strictness matters.
- Enforce size limits on uploads and request bodies.

### Output & injection

- Encode or parameterize output by context (HTML, SQL, shell, URLs).
- Use ORM/query builders with parameters — no string-concatenated SQL.
- Avoid `dangerouslySetInnerHTML` unless sanitized; prefer framework defaults.
- Set security headers where applicable (`X-Content-Type-Options`, `X-Frame-Options`, CSP).

### Files & paths

- Store uploads outside the web root; serve through authenticated handlers.
- Resolve paths and verify they stay inside allowed directories (prevent path traversal).
- Validate MIME type **and** extension; don’t trust client-provided types alone.
- Scan/limit file size; virus scanning for high-risk deployments.

### APIs & errors

- Return generic messages to clients (`401`/`403`/`404`); log details server-side.
- Rate-limit auth and upload endpoints when exposed to the internet.
- Don’t expose stack traces, schema, or internal IDs unnecessarily in production.

### Dependencies & supply chain

- Pin versions; run `npm audit` / equivalent before release.
- Prefer well-maintained packages; avoid copying unvetted snippets from the web.
- Keep framework and runtime patched.

## Implementation checklist

Copy and track when shipping a feature:

```
- [ ] Scope limited to the requested change
- [ ] Input validated at API/service boundary
- [ ] AuthN + AuthZ checked server-side for every protected route
- [ ] No secrets or PII in logs, commits, or client responses
- [ ] User-controlled paths/files constrained and validated
- [ ] Errors safe for clients; useful for operators
- [ ] Tests cover auth denial and invalid input (when non-trivial)
```

## Review feedback format

When reviewing code, classify findings:

- **Critical** — Must fix before merge (auth bypass, secret leak, injection, path traversal)
- **Warning** — Should fix (missing validation, weak defaults, error leakage)
- **Suggestion** — Optional improvement (readability, minor hardening)

## Anti-patterns

| Avoid | Prefer |
|-------|--------|
| Security only in the UI | Server-side checks in every handler |
| `eval`, dynamic `require(path)` | Static imports, allowlists |
| Trusting `Content-Type` from client | Magic bytes + extension allowlist |
| `SELECT *` + string interpolation | Parameterized queries, explicit fields |
| Logging full request bodies | Redact tokens, passwords, file content |
| “Security through obscurity” | Real authz + defense in depth |

## Stack-specific notes

Read [reference.md](reference.md) when working with:

- Next.js / App Router / API routes / middleware
- Prisma / SQL databases
- File uploads and local storage
- Auth.js / session-based auth

## When unsure

1. Assume input is malicious.
2. Default to deny access.
3. Ask whether the feature must be public; if not, protect it.
4. Prefer proven library behavior over custom crypto or auth.
