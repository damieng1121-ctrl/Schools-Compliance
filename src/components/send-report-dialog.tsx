"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Recipient = { id: string; name: string | null; email: string; role?: string };

function parseExtraEmails(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** "Send to…" control: lets the sender pick specific recipients (from a fetched list) plus any extra email addresses, rather than firing straight off to a fixed default. */
export function SendReportDialog({
  endpoint,
  fetchRecipients,
}: {
  endpoint: string;
  fetchRecipients: () => Promise<Recipient[]>;
}) {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [extraEmails, setExtraEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function openDialog() {
    setOpen(true);
    setResult(null);
    if (!recipients) {
      const list = await fetchRecipients();
      setRecipients(list);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const extraCount = parseExtraEmails(extraEmails).length;
  const canSend = (selected.size > 0 || extraCount > 0) && !sending;

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [...selected], extraEmails: parseExtraEmails(extraEmails) }),
      });
      const body = await res.json();
      if (!res.ok) {
        setResult({ type: "error", text: body.error ?? "Something went wrong." });
        return;
      }
      setResult({ type: "ok", text: `Sent to ${body.to}` });
      setSelected(new Set());
      setExtraEmails("");
    } catch {
      setResult({ type: "error", text: "Something went wrong." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative inline-block print:hidden">
      <Button variant="secondary" onClick={() => (open ? setOpen(false) : openDialog())}>
        <Mail size={15} />
        Send to…
      </Button>

      {open && (
        <Card className="absolute right-0 top-full z-20 mt-2 w-80 max-w-[90vw] p-4 text-left shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Send report to…</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>

          {recipients === null ? (
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
              {recipients.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    {r.name ?? r.email} <span className="text-slate-400">· {r.email}</span>
                  </span>
                </label>
              ))}
              {recipients.length === 0 && <p className="px-1.5 py-1 text-sm text-slate-500">No one to select yet.</p>}
            </div>
          )}

          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-600">Other email addresses</label>
            <textarea
              value={extraEmails}
              onChange={(e) => setExtraEmails(e.target.value)}
              placeholder="one per line, or comma-separated"
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {result && (
            <p className={`mt-3 rounded-lg px-3 py-2 text-xs ${result.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {result.text}
            </p>
          )}

          <Button className="mt-3 w-full" onClick={send} disabled={!canSend}>
            {sending ? "Sending…" : `Send${selected.size + extraCount > 0 ? ` (${selected.size + extraCount})` : ""}`}
          </Button>
        </Card>
      )}
    </div>
  );
}
