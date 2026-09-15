"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { ShieldCheck, ClipboardCheck, Mail } from "lucide-react";
import { PlatformBadge } from "@/components/platform-badge";
import { Button } from "@/components/ui/button";
import { AuthShell, AuthPanel } from "@/components/auth-shell";

function GoogleError() {
  const params = useSearchParams();
  const error = params.get("error");
  if (!error) return null;
  return (
    <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      {error === "AccessDenied"
        ? "That Google account isn't set up for this dashboard. Ask your school's admin to add you first, or contact the platform team."
        : "Something went wrong signing you in with Google. Please try again."}
    </p>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 text-left">
      <div>
        <label className="block text-xs font-medium text-slate-600">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
        />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function GoogleSignInButton() {
  return (
    <Button variant="secondary" onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="mt-4 w-full">
      <GoogleIcon />
      Sign in with Google
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      panel={
        <AuthPanel
          title="Sign in to your dashboard"
          description="Track readiness against the DfE digital & technology standards, keep evidence in one place, and report progress with a click."
          points={[
            { icon: ShieldCheck, text: "12 standards, 41 checkpoints — all in one place" },
            { icon: ClipboardCheck, text: "Evidence, notes, and review dates per item" },
            { icon: Mail, text: "Email yourself a progress report any time" },
          ]}
        />
      }
    >
      <div className="mx-auto mb-4 lg:hidden">
        <PlatformBadge />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Sign in</h1>
      <p className="mt-1.5 text-sm text-slate-500">Sign in to your school&apos;s compliance dashboard.</p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <div className="mt-6 flex items-center gap-3 text-xs font-medium text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleSignInButton />
      <Suspense fallback={null}>
        <GoogleError />
      </Suspense>
      <p className="mt-6 text-sm text-slate-500">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-red-600 hover:underline">
          Set up your school
        </Link>
      </p>
    </AuthShell>
  );
}
