"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, UserPlus, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Parent = { id: string; name: string | null; email: string; role: string };
type Invitation = {
  id: string;
  status: string;
  email: string | null;
  expiresAt: string | null;
  createdAt: string;
  url: string | null;
};

export function InviteParentCard() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/invitations");
    if (!res.ok) throw new Error("Could not load family");
    const data = await res.json();
    setParents(data.parents ?? []);
    setInvitations(data.invitations ?? []);
  }

  useEffect(() => {
    refresh()
      .catch(() => setError("Could not load family members"))
      .finally(() => setLoading(false));
  }, []);

  async function createInvite() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/invitations", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create invite");
      await refresh();
      if (data.url) {
        await navigator.clipboard.writeText(data.url).catch(() => undefined);
        setCopiedId(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    setError("");
    const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not revoke invite");
      return;
    }
    await refresh();
  }

  async function copy(url: string, id: string) {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
  }

  const pending = invitations.filter((i) => i.status === "PENDING");
  const hasPartner = parents.length >= 2;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">
        Loading family…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="font-editorial text-xl">Parents</h2>
        <p className="text-sm text-muted mt-1">
          Only the two of you. Share a one-time link — registration stays closed.
        </p>
      </div>

      <ul className="space-y-2">
        {parents.map((parent) => (
          <li
            key={parent.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-cream/60 px-4 py-3 text-sm"
          >
            <span className="truncate">
              {parent.name ?? parent.email}
              <span className="text-muted"> · {parent.email}</span>
            </span>
            <span className="text-xs uppercase tracking-wider text-muted shrink-0">
              {parent.role === "OWNER" ? "Owner" : "Parent"}
            </span>
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {pending.map((invite) => (
        <div
          key={invite.id}
          className="rounded-xl border border-dashed border-accent/40 bg-cream/40 px-4 py-3 space-y-2"
        >
          <p className="text-sm font-medium">Pending invite</p>
          {invite.url && (
            <p className="text-xs text-muted break-all">{invite.url}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {invite.url && (
              <button
                type="button"
                onClick={() => copy(invite.url!, invite.id)}
                className={cn(buttonVariants("outline", "sm"))}
              >
                {copiedId === invite.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiedId === invite.id ? "Copied" : "Copy link"}
              </button>
            )}
            <button
              type="button"
              onClick={() => revoke(invite.id)}
              className={cn(buttonVariants("ghost", "sm"))}
            >
              <X className="h-3.5 w-3.5" />
              Revoke
            </button>
          </div>
        </div>
      ))}

      {!hasPartner && pending.length === 0 && (
        <button
          type="button"
          onClick={createInvite}
          disabled={creating}
          className={cn(buttonVariants("secondary", "md"))}
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Invite the other parent
        </button>
      )}

      {hasPartner && (
        <p className="text-sm text-muted">Both parents have access.</p>
      )}
    </div>
  );
}
