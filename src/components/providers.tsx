"use client";

import { SessionProvider } from "next-auth/react";
import { DevPhoneBanner } from "@/components/dev-phone-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
      <DevPhoneBanner />
    </SessionProvider>
  );
}
