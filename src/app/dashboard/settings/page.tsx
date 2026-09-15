"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/input";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => (r.ok ? r.json() : null))
      .then((t) => {
        if (t) {
          setName(t.name ?? "");
          setLogoUrl(t.logoUrl ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logoUrl }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: body.error ?? "Something went wrong." });
        return;
      }
      setMessage({ type: "ok", text: "Saved." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">School settings</h1>
      <Card className="mt-6 max-w-md p-5">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">Branding</h2>
        </div>
        <form onSubmit={onSubmit} className="mt-3 space-y-4">
          <div>
            <label className={labelClass}>School name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Logo URL</label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              A link to your school&apos;s logo image, hosted anywhere reachable over HTTPS. Shown in
              place of the default badge in your dashboard&apos;s sidebar.
            </p>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable source; next/image's domain allowlist doesn't fit here
              <img src={logoUrl} alt="Logo preview" className="mt-2 h-10 w-10 rounded-lg border border-slate-100 object-contain" />
            )}
          </div>
          {message && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
            >
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
