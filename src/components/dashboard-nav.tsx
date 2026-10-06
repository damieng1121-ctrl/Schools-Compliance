"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ShieldCheck, LayoutDashboard, Users, LogOut, UserCircle, Building2, Settings, UserCog, ChevronRight, Menu, X } from "lucide-react";
import clsx from "clsx";
import { PlatformBadge } from "@/components/platform-badge";
import { Avatar } from "@/components/ui/avatar";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, tenantOnly: true },
  { href: "/dashboard/compliance", label: "Digital standards", icon: ShieldCheck, tenantOnly: true },
  { href: "/dashboard/team", label: "Team", icon: Users, tenantOnly: true, adminOnly: true },
  { href: "/dashboard/settings", label: "School settings", icon: Settings, tenantOnly: true, adminOnly: true },
  { href: "/dashboard/super-admin", label: "All schools", icon: Building2, superAdminOnly: true },
  { href: "/dashboard/super-admin/admins", label: "Platform admins", icon: UserCog, superAdminOnly: true },
  { href: "/dashboard/account", label: "Account", icon: UserCircle },
];

export function DashboardNav({
  tenantName,
  tenantLogoUrl,
  userName,
  isAdmin,
  isSuperAdmin,
}: {
  tenantName: string;
  tenantLogoUrl?: string | null;
  userName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = LINKS.filter((l) => {
    if (l.superAdminOnly) return isSuperAdmin;
    if (l.tenantOnly && isSuperAdmin) return false;
    if (l.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          {tenantLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, per-tenant source; next/image's domain allowlist doesn't fit here
            <img src={tenantLogoUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
          ) : (
            <PlatformBadge size={28} />
          )}
          <span className="text-sm font-bold tracking-tight text-slate-900">Schools Compliance</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}

      <nav
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col bg-white transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 lg:border-r lg:border-slate-200/80",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-5 py-6">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              {tenantLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external, per-tenant source; next/image's domain allowlist doesn't fit here
                <img src={tenantLogoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
              ) : (
                <PlatformBadge size={32} />
              )}
              <span className="truncate text-[15px] font-bold tracking-tight text-slate-900">Schools Compliance</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
          <p className="mt-3 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
            {tenantName}
          </p>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {active && <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-slate-900" />}
                <Icon size={17} strokeWidth={2.25} className={active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-500"} />
                {link.label}
                {active && <ChevronRight size={14} className="ml-auto text-slate-400" />}
              </Link>
            );
          })}
        </div>
        <div className="mx-3 mb-4 mt-4 flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
          <Avatar name={userName} size={30} />
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{userName}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
          >
            <LogOut size={15} />
          </button>
        </div>
      </nav>
    </>
  );
}
