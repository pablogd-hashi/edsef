---
name: invite-parent
description: Invite the second parent to the same Memoria family via a one-time link. Use when the user wants their partner to join, or to test the invite flow.
disable-model-invocation: true
---

# Invite the other parent

App must be running. Sign in as the owner.

1. Open http://localhost:3000/settings (or **Family** in the header).
2. Click **Invite the other parent**. Copy the `/invite/...` link.
3. Open the link in a private window (or on the partner's phone). Create name, email, password.
4. Sign in as the partner. They must see the **same children**, not an empty dashboard.

Then run `/lock-registration`. Unused invites can be revoked on the same settings page. Tokens expire in 7 days and work once.
