"use client";

import { useState } from "react";
import { FolderOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Evidence = { evidenceUrl: string | null; updatedAt: string | null; updatedByName?: string | null };

/** One evidence link per standard (e.g. a Google Drive folder) — replaces having a separate Evidence URL on every item. */
export function StandardEvidenceArea({ endpoint, evidence }: { endpoint: string; evidence: Evidence }) {
  const [url, setUrl] = useState(evidence.evidenceUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceUrl: url }),
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-b border-slate-100 bg-slate-50/60 p-5">
      <div className="flex items-center gap-2">
        <FolderOpen size={15} className="text-slate-400" />
        <p className="text-sm font-semibold text-slate-900">Evidence</p>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        One link covering this whole standard — a Google Drive folder works well. Share it with &ldquo;Anyone with
        the link&rdquo; (or your reviewers directly), not restricted to your school&apos;s internal Drive users.
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/…"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
        />
        <Button size="sm" onClick={save} disabled={saving}>
          {justSaved && <Check size={14} />}
          {saving ? "Saving…" : justSaved ? "Saved" : "Save"}
        </Button>
      </div>
      {evidence.updatedAt && (
        <p className="mt-1.5 text-xs text-slate-400">
          Last updated {new Date(evidence.updatedAt).toLocaleDateString("en-GB")}
          {evidence.updatedByName ? ` by ${evidence.updatedByName}` : ""}
        </p>
      )}
    </div>
  );
}
