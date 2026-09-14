"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ShieldCheck, LayoutDashboard, Users, LogOut, UserCircle } from "lucide-react";
import clsx from "clsx";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/compliance", label: "Digital standards", icon: ShieldCheck },
  { href: "/dashboard/team", label: "Team", icon: Users, adminOnly: true },
  { href: "/dashboard/account", label: "Account", icon: UserCircle },
];

export function DashboardNav({
  tenantName,
  userName,
  isAdmin,
}: {
  tenantName: string;
  userName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
            SC
          </div>
          <span className="font-semibold text-slate-900">Schools Compliance</span>
        </div>
        <p className="mt-2 truncate text-xs text-slate-600">{tenantName}</p>
      </div>
      <div className="flex-1 space-y-1 px-3 py-4">
        {LINKS.filter((l) => !l.adminOnly || isAdmin).map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50",
              )}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-slate-100 px-3 py-4">
        <p className="truncate px-3 text-xs text-slate-600">{userName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </nav>
  );
}
