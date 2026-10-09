---
name: reset-password
description: Reset a Memoria account password from the Mac when someone forgot it. There is no email "forgot password" flow on a private install.
disable-model-invocation: true
---

# Reset a password

Postgres must be running (`task db:up` or `task up`).

```bash
npm run reset-password -- you@example.com
```

- The script asks for the new password (8–100 characters) without echoing it.
- Every existing login for that account is signed out; sign in again on each device.

Prefer this over editing `User.passwordHash` by hand — it stores a bcrypt hash the same way `/register` does.
