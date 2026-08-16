---
name: lock-registration
description: Disable open /register after both parents have accounts. Use when the user wants to close sign-up or set ALLOW_REGISTRATION=false.
disable-model-invocation: true
---

# Lock registration

After the owner account exists (and after `/invite-parent` if you want a second parent):

1. In `.env`, set:

```
ALLOW_REGISTRATION="false"
```

2. Restart the app (`/start-dev` or `/start-prod`).

Pass: `/register` redirects to login. New accounts only via an unused invite link. Do not reopen registration.
