"use client";

import { useSyncExternalStore } from "react";

/** Phone/tablet: coarse pointer, no hover. Used to skip animations that flicker on iOS. */
function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getTouchUiSnapshot() {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

export function useTouchUi(): boolean {
  return useSyncExternalStore(subscribe, getTouchUiSnapshot, () => false);
}
