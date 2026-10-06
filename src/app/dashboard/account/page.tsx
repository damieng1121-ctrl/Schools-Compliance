"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/input";

export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: body.error ?? "Something went wrong." });
        return;
      }
      setMessage({ type: "ok", text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:max-w-sm">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900">Change password</h2>
          </div>
          <form onSubmit={onSubmit} className="mt-3 space-y-3">
            <div>
              <label className={labelClass}>Current password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            {message && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
              >
                {message.text}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Update password"}
            </Button>
          </form>
        </Card>

        <TwoFactorCard />
      </div>
    </div>
  );
}

type TwoFactorStage =
  | { name: "idle" }
  | { name: "password" }
  | { name: "setup"; currentPassword: string; qrDataUrl: string; secret: string }
  | { name: "backup-codes"; codes: string[] };

function TwoFactorCard() {
  const [stage, setStage] = useState<TwoFactorStage>({ name: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");

    const res = await fetch("/api/account/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setStage({ name: "setup", currentPassword, qrDataUrl: data.qrDataUrl, secret: data.secret });
  }

  async function onCodeSubmit(e: React.FormEvent<HTMLFormElement>, current: Extract<TwoFactorStage, { name: "setup" }>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const code = String(form.get("code") ?? "");

    const res = await fetch("/api/account/2fa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current.currentPassword, secret: current.secret, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "That code didn't match — check the time on your phone and try again.");
      return;
    }
    setStage({ name: "backup-codes", codes: data.backupCodes });
  }

  if (stage.name === "password") {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">Set up 2FA on a new device</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">Confirm your password to continue.</p>
        <form onSubmit={onPasswordSubmit} className="mt-3 space-y-3">
          <div>
            <label className={labelClass}>Current password</label>
            <input name="currentPassword" type="password" required autoFocus className={inputClass} />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Checking…" : "Continue"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStage({ name: "idle" })}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  if (stage.name === "setup") {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">Scan this QR code</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Scan with your authenticator app, then enter the 6-digit code it shows. This replaces your current 2FA —
          your old authenticator and backup codes will stop working once confirmed.
        </p>
        <form onSubmit={(e) => onCodeSubmit(e, stage)} className="mt-3 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stage.qrDataUrl} alt="2FA setup QR code" className="mx-auto h-40 w-40 rounded-lg border border-slate-200" />
          <p className="break-all rounded-lg bg-slate-50 px-3 py-2 text-center font-mono text-xs text-slate-500">
            {stage.secret}
          </p>
          <div>
            <label className={labelClass}>6-digit code</label>
            <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus className={inputClass} />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Verifying…" : "Verify & save"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStage({ name: "idle" })}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  if (stage.name === "backup-codes") {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600" />
          <h2 className="font-semibold text-slate-900">2FA updated</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Save these new backup codes somewhere safe — each works once if you lose access to your authenticator app.
          Your old backup codes no longer work.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
          {stage.codes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <Button type="button" className="mt-3" onClick={() => setStage({ name: "idle" })}>
          Done
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-slate-400" />
        <h2 className="font-semibold text-slate-900">Two-factor authentication</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        2FA is required and already set up on this account. Getting a new phone or lost your authenticator app? Set
        it up again here.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-3"
        onClick={() => {
          setError(null);
          setStage({ name: "password" });
        }}
      >
        Set up on a new device
      </Button>
    </Card>
  );
}
