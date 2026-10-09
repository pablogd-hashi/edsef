"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Mount heavy yearbook sections only when scrolled near — scales as content grows. */
export function LazySection({
  sectionId,
  eager = false,
  children,
  className,
}: {
  sectionId: string;
  eager?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(eager);

  useEffect(() => {
    if (eager || mounted) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "320px 0px 480px 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager, mounted]);

  return (
    <section ref={ref} id={sectionId} className={cn(className, !mounted && "min-h-[10rem]")}>
      {mounted ? children : null}
    </section>
  );
}
