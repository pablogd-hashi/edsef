"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function DeleteYearbookButton({
  childId,
  yearbookId,
  yearbookTitle,
}: {
  childId: string;
  yearbookId: string;
  yearbookTitle: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/yearbooks/${yearbookId}?childId=${childId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
      }
      router.refresh();
    } catch {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted hidden sm:inline">
          Delete &ldquo;{yearbookTitle}&rdquo;?
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleDelete()}
          className={cn(buttonVariants("primary", "sm"), "bg-red-600 hover:bg-red-700")}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={cn(buttonVariants("ghost", "sm"))}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={cn(
        buttonVariants("ghost", "sm"),
        "text-muted hover:text-red-600 hover:bg-red-50"
      )}
      title="Delete this year"
    >
      <Trash2 className="h-4 w-4" />
      <span className="hidden sm:inline">Delete</span>
    </button>
  );
}
