"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Sparkles, Users2, FileCheck2 } from "lucide-react";
import { PlatformBadge } from "@/components/platform-badge";
import { Button } from "@/components/ui/button";
import { AuthShell, AuthPanel } from "@/components/auth-shell";

export default function SignupPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName, name, email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      panel={
        <AuthPanel
          title="Set up your school in minutes"
          description="Get your own compliance dashboard, pre-loaded with the full DfE standards checklist — ready to work through today."
          points={[
            { icon: Sparkles, text: "No setup required — start ticking off items right away" },
            { icon: Users2, text: "Invite your team once you're in" },
            { icon: FileCheck2, text: "Your data stays private to your school" },
          ]}
        />
      }
    >
      <div className="mx-auto mb-4 lg:hidden">
        <PlatformBadge />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Set up your school</h1>
      <p className="mt-1.5 text-sm text-slate-500">Creates your school&apos;s account and signs you in as the admin.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">School name</label>
          <input
            required
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
            placeholder="Enter school name here"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Your name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-red-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
