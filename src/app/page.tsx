import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldCheck, ClipboardCheck, Mail } from "lucide-react";
import { PlatformBadge } from "@/components/platform-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicFooter } from "@/components/public-footer";

const FEATURES = [
  { icon: ShieldCheck, title: "12 standards, 41 checkpoints", text: "The full DfE digital & technology standards checklist, ready to work through." },
  { icon: ClipboardCheck, title: "Evidence in one place", text: "Notes, links, and review dates against every item — no more scattered spreadsheets." },
  { icon: Mail, title: "Report in a click", text: "Email yourself a progress report any time, ready to share or keep for your records." },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col bg-[#f7f7f8]">
      <div className="flex flex-1 flex-col items-center px-6 py-20">
        <div className="mx-auto mb-5">
          <PlatformBadge size={48} />
        </div>
        <h1 className="max-w-xl text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Track your school&apos;s readiness against the DfE digital &amp; technology standards
        </h1>
        <p className="mt-4 max-w-lg text-center text-sm text-slate-500">
          A self-service compliance dashboard: tick off standards as you meet them, keep evidence in one
          place, and email yourself a progress report whenever you need one.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup">
            <Button>Set up your school</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Sign in</Button>
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon size={18} />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-xs text-slate-500">{text}</p>
            </Card>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
