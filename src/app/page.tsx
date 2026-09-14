import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-20 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 font-semibold text-white">
        SC
      </div>
      <h1 className="max-w-xl text-3xl font-semibold text-slate-900">
        Track your school&apos;s readiness against the DfE digital &amp; technology standards
      </h1>
      <p className="mt-3 max-w-lg text-sm text-slate-600">
        A self-service compliance dashboard: tick off standards as you meet them, keep evidence in one
        place, and email yourself a progress report whenever you need one.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Set up your school
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
