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

function TimeoutNotice() {
  const params = useSearchParams();
  if (!params.get("timeout")) return null;
  return (
    <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
      You were signed out after 5 minutes of inactivity. Any unsaved changes were saved first — please sign in
      again.
    </p>
  );
}

type Stage =
  | { name: "credentials" }
  | { name: "setup"; email: string; password: string; qrDataUrl: string; secret: string }
  | { name: "code"; email: string; password: string; useBackupCode: boolean }
  | { name: "backup-codes"; codes: string[] };

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100";

function LoginForm({ onStageChange }: { onStageChange: (isCredentials: boolean) => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [stage, setStageRaw] = useState<Stage>({ name: "credentials" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setStage(next: Stage) {
    setStageRaw(next);
    onStageChange(next.name === "credentials");
  }

  async function finishSignIn(email: string, password: string, code: string) {
    const res = await signIn("credentials", { email, password, code, redirect: false });
    if (res?.error) {
      setError("That code didn't work — check your authenticator app and try again.");
      setLoading(false);
      return;
    }
    router.push(params.get("callbackUrl") ?? "/dashboard");
  }

  async function onCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const res = await fetch("/api/auth/2fa/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Incorrect email or password.");
      return;
    }
    if (data.stage === "setup") {
      setStage({ name: "setup", email, password, qrDataUrl: data.qrDataUrl, secret: data.secret });
    } else {
      setStage({ name: "code", email, password, useBackupCode: false });
    }
  }

  async function onSetupSubmit(e: React.FormEvent<HTMLFormElement>, current: Extract<Stage, { name: "setup" }>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const code = String(form.get("code") ?? "");

    const res = await fetch("/api/auth/2fa/confirm-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: current.email, password: current.password, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "That code didn't match — check the time on your phone and try again.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email: current.email,
      password: current.password,
      code,
      redirect: false,
    });
    setLoading(false);
    if (signInRes?.error) {
      // Extremely unlikely (the code's 30s window rolled over between the
      // two requests) — fall back to the normal code-entry screen.
      setStage({ name: "code", email: current.email, password: current.password, useBackupCode: false });
      setError("2FA is set up — enter a fresh code from your app to finish signing in.");
      return;
    }
    setStage({ name: "backup-codes", codes: data.backupCodes });
  }

  async function onCodeSubmit(e: React.FormEvent<HTMLFormElement>, current: Extract<Stage, { name: "code" }>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const code = String(form.get("code") ?? "");
    await finishSignIn(current.email, current.password, code);
  }

  if (stage.name === "setup") {
    return (
      <form onSubmit={(e) => onSetupSubmit(e, stage)} className="mt-6 space-y-4 text-left">
        <p className="text-sm text-slate-600">
          Set up two-factor authentication: scan this QR code with an authenticator app (Google Authenticator, Authy,
          1Password, etc.), then enter the 6-digit code it shows.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stage.qrDataUrl}
          alt="2FA setup QR code"
          className="mx-auto h-40 w-40 rounded-lg border border-slate-200"
        />
        <p className="break-all rounded-lg bg-slate-50 px-3 py-2 text-center font-mono text-xs text-slate-500">
          {stage.secret}
        </p>
        <div>
          <label className="block text-xs font-medium text-slate-600">6-digit code</label>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            className={inputClass}
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Verifying…" : "Verify & enable"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setStage({ name: "credentials" });
            setError(null);
          }}
          className="block w-full text-center text-xs text-slate-400 hover:text-slate-600 hover:underline"
        >
          Back
        </button>
      </form>
    );
  }

  if (stage.name === "code") {
    return (
      <form onSubmit={(e) => onCodeSubmit(e, stage)} className="mt-6 space-y-4 text-left">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            {stage.useBackupCode ? "Backup code" : "Authentication code"}
          </label>
          <input
            name="code"
            inputMode={stage.useBackupCode ? "text" : "numeric"}
            autoComplete="one-time-code"
            placeholder={stage.useBackupCode ? "XXXXX-XXXXX" : undefined}
            maxLength={stage.useBackupCode ? 11 : 6}
            required
            autoFocus
            className={inputClass}
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setStage({ ...stage, useBackupCode: !stage.useBackupCode });
            setError(null);
          }}
          className="block w-full text-center text-xs text-slate-400 hover:text-slate-600 hover:underline"
        >
          {stage.useBackupCode ? "Use your authenticator app instead" : "Use a backup code instead"}
        </button>
      </form>
    );
  }

  if (stage.name === "backup-codes") {
    return (
      <div className="mt-6 space-y-4 text-left">
        <p className="text-sm text-slate-600">
          Save these one-time backup codes somewhere safe — each can be used once to sign in if you lose access to
          your authenticator app. They won&apos;t be shown again.
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
          {stage.codes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <Button type="button" className="w-full" onClick={() => router.push(params.get("callbackUrl") ?? "/dashboard")}>
          I&apos;ve saved these — continue
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onCredentialsSubmit} className="mt-6 space-y-4 text-left">
      <div>
        <label className="block text-xs font-medium text-slate-600">Email</label>
        <input name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Password</label>
        <input name="password" type="password" required className={inputClass} />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Checking…" : "Continue"}
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
  const [showGoogle, setShowGoogle] = useState(true);

  return (
    <AuthShell
      panel={
        <AuthPanel
          title="Sign in to your dashboard"
          description="Track readiness against the DfE digital & technology standards, keep evidence in one place, and report progress with a click."
          points={[
            { icon: ShieldCheck, text: "12 standards, 50 checkpoints — all in one place" },
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
      <div className="mt-4">
        <Suspense fallback={null}>
          <TimeoutNotice />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <LoginForm onStageChange={setShowGoogle} />
      </Suspense>
      {showGoogle && (
        <>
          <div className="mt-6 flex items-center gap-3 text-xs font-medium text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            or
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <GoogleSignInButton />
          <Suspense fallback={null}>
            <GoogleError />
          </Suspense>
        </>
      )}
      <p className="mt-6 text-xs text-slate-400">
        <Link href="/privacy" className="hover:text-slate-600 hover:underline">
          Privacy
        </Link>{" "}
        &middot;{" "}
        <Link href="/terms" className="hover:text-slate-600 hover:underline">
          Terms
        </Link>{" "}
        &middot;{" "}
        <a
          href="https://www.education-lincs.com/contact/contact.html"
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-600 hover:underline"
        >
          Contact us
        </a>
      </p>
    </AuthShell>
  );
}
