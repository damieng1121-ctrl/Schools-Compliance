import type { ReactNode } from "react";
import Link from "next/link";
import { PlatformBadge } from "@/components/platform-badge";
import { PublicFooter } from "@/components/public-footer";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-[#f7f7f8] dark:bg-slate-950">
      <div className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <PlatformBadge size={28} />
            <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-100">Schools Compliance</span>
          </Link>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Last updated {updated}</p>
          <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
