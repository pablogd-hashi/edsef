"use client";

import { useTouchUi } from "@/lib/use-touch-ui";

/** Dev HMR repaints every screen on iPhone — point people at task lan:serve. */
export function DevPhoneBanner() {
  const touch = useTouchUi();
  if (process.env.NODE_ENV !== "development" || !touch) return null;

  return (
    <div className="dev-phone-banner fixed bottom-0 inset-x-0 z-[100] border-t border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950 shadow-lg">
      Dev mode flickers on phones. On the Mac run{" "}
      <strong className="font-semibold">task lan:serve</strong>, then reload this page.
    </div>
  );
}
