"use client";

import { useEffect, useState } from "react";

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

  if (loading) return <p className="text-sm text-slate-700">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">School settings</h1>
      <div className="mt-6 max-w-md rounded-xl border border-slate-200 bg-white p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700">School name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">Logo URL</label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <p className="mt-1 text-xs text-slate-600">
              A link to your school&apos;s logo image, hosted anywhere reachable over HTTPS. Shown in
              place of the default badge in your dashboard&apos;s sidebar.
            </p>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable source; next/image's domain allowlist doesn't fit here
              <img src={logoUrl} alt="Logo preview" className="mt-2 h-10 w-10 rounded-lg object-contain" />
            )}
          </div>
          {message && (
            <p className={`rounded-md px-3 py-2 text-sm ${message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
