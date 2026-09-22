"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/input";

type CatalogueItem = { id: string; title: string; guidance: string | null };
type Outcome = "PASS" | "FAIL" | "NOT_APPLICABLE" | "NOT_TESTED";
type DeviceDraft = { label: string; results: Record<string, { outcome: Outcome; actionNotes: string }> };

function blankResults(catalogue: CatalogueItem[]): DeviceDraft["results"] {
  return Object.fromEntries(catalogue.map((item) => [item.id, { outcome: "NOT_TESTED" as Outcome, actionNotes: "" }]));
}

export function FilteringCheckForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [catalogue, setCatalogue] = useState<CatalogueItem[] | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [hasDslEmail, setHasDslEmail] = useState(false);
  const [devices, setDevices] = useState<DeviceDraft[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<"save" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/super-admin/filtering-check-items").then((r) => r.json()),
      fetch(`/api/super-admin/tenants/${tenantId}`).then((r) => r.json()),
    ]).then(([items, tenant]: [CatalogueItem[], { name: string; dslEmail: string | null }]) => {
      setCatalogue(items);
      setSchoolName(tenant.name);
      setHasDslEmail(!!tenant.dslEmail);
      setDevices([{ label: "", results: blankResults(items) }]);
    });
  }, [tenantId]);

  function addDevice() {
    if (!catalogue) return;
    setDevices((prev) => [...prev, { label: "", results: blankResults(catalogue) }]);
  }

  function removeDevice(index: number) {
    setDevices((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDevice(index: number, patch: Partial<DeviceDraft>) {
    setDevices((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function updateResult(deviceIndex: number, itemId: string, patch: Partial<{ outcome: Outcome; actionNotes: string }>) {
    setDevices((prev) =>
      prev.map((d, i) =>
        i === deviceIndex ? { ...d, results: { ...d.results, [itemId]: { ...d.results[itemId], ...patch } } } : d,
      ),
    );
  }

  async function submit(sendToDsl: boolean) {
    setSaving(sendToDsl ? "send" : "save");
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/filtering-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes || undefined,
          devices: devices.map((d) => ({
            label: d.label,
            results: Object.entries(d.results).map(([itemId, r]) => ({
              itemId,
              outcome: r.outcome,
              actionNotes: r.actionNotes || undefined,
            })),
          })),
          sendToDsl,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }
      router.push(`/dashboard/super-admin/${tenantId}/filtering-checks/${body.id}`);
    } finally {
      setSaving(null);
    }
  }

  if (!catalogue) return <p className="text-sm text-slate-500">Loading…</p>;

  const canSubmit = devices.length > 0 && devices.every((d) => d.label.trim().length > 0);

  return (
    <div>
      <Link
        href={`/dashboard/super-admin/${tenantId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        {schoolName || "Back"}
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Log a Filtering &amp; Monitoring check</h1>
      <p className="mt-1 text-sm text-slate-500">
        Add every device, account, or location tested — remember portacabins, trolleys, home devices, guest networks,
        BYOD, and the most recent new or rebuilt device.
      </p>

      <Card className="mt-6 p-5">
        <label className={labelClass}>Visit notes (optional)</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          placeholder="Anything general worth recording about this visit"
        />
      </Card>

      <div className="mt-6 space-y-6">
        {devices.map((device, deviceIndex) => (
          <Card key={deviceIndex} className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5">
              <div className="flex-1">
                <label className={labelClass}>What was tested</label>
                <input
                  required
                  value={device.label}
                  onChange={(e) => updateDevice(deviceIndex, { label: e.target.value })}
                  placeholder="e.g. Staff laptop — reception, Student login — Y7, Guest network"
                  className={inputClass}
                />
              </div>
              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDevice(deviceIndex)}
                  className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove this device"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {catalogue.map((item) => {
                const result = device.results[item.id];
                return (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                      {item.guidance && <p className="mt-0.5 text-xs text-slate-500">{item.guidance}</p>}
                      <input
                        value={result.actionNotes}
                        onChange={(e) => updateResult(deviceIndex, item.id, { actionNotes: e.target.value })}
                        placeholder="Notes or action taken (optional)"
                        className="mt-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                      />
                    </div>
                    <select
                      value={result.outcome}
                      onChange={(e) => updateResult(deviceIndex, item.id, { outcome: e.target.value as Outcome })}
                      className="mt-0.5 shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    >
                      <option value="NOT_TESTED">Not tested</option>
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                      <option value="NOT_APPLICABLE">N/A</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={addDevice} className="mt-4">
        <PlusCircle size={14} />
        Add another device tested
      </Button>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <Button type="button" variant="secondary" onClick={() => submit(false)} disabled={!canSubmit || saving !== null}>
          {saving === "save" ? "Saving…" : "Save"}
        </Button>
        <Button type="button" onClick={() => submit(true)} disabled={!canSubmit || !hasDslEmail || saving !== null}>
          {saving === "send" ? "Saving…" : "Save & email DSL"}
        </Button>
        {!hasDslEmail && <p className="text-xs text-slate-500">Add a DSL email on this school to enable sending.</p>}
      </div>
    </div>
  );
}
