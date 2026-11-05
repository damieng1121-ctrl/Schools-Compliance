"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import clsx from "clsx";

/**
 * Light/dark mode toggle. `resolvedTheme` is undefined on the server and on
 * the first client render alike, so treating that as "light" renders
 * identically both times — no hydration mismatch, and no mount-tracking
 * effect needed. Once next-themes resolves the real theme client-side, this
 * re-renders with the correct icon.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={clsx(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300",
        className,
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
