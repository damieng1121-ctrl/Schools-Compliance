"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { flushAll } from "@/lib/idle-logout";

const IDLE_LIMIT_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "wheel", "touchstart"] as const;

/**
 * Signs the user out after 5 minutes with no mouse/keyboard/scroll activity
 * anywhere in the dashboard, saving any in-progress form edits first (via
 * src/lib/idle-logout.ts) so nothing typed is lost. Mounted once in
 * src/app/dashboard/layout.tsx, so it covers every authenticated page.
 */
export function IdleTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    function scheduleLogout() {
      if (loggingOutRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        loggingOutRef.current = true;
        try {
          await flushAll();
        } finally {
          await signOut({ callbackUrl: "/login?timeout=1" });
        }
      }, IDLE_LIMIT_MS);
    }

    scheduleLogout();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, scheduleLogout, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, scheduleLogout));
    };
  }, []);

  return null;
}
