"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Code2, Plus, Trash2, Copy, CheckCircle } from "lucide-react";

interface Site {
  id: string;
  name: string;
  domain: string;
}

interface AdUnit {
  id: string;
  name: string;
  adType: string;
  sizes: string;
  bidFloor: number;
  status: string;
  site: Site;
}

const BANNER_SIZES = ["300x250", "728x90", "320x50", "300x600", "970x90", "160x600"];
const VIDEO_SIZES = ["640x480", "1280x720"];

// Fix 6: Robust clipboard copy — works in all browsers including HTTP
function copyToClipboard(text: string): Promise<void> {
  // Modern clipboard API (HTTPS / localhost)
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for HTTP
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    ta.setAttribute("readonly", "");
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("execCommand failed"));
    } catch (e) {
      document.body.removeChild(ta);
      reject(e);
    }
  });
}

export default function AdUnitsPage() {
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [tagModal, setTagModal] = useState<{ open: boolean; tag: string; unitId: string }>({
    open: false, tag: "", unitId: "",
  });
  const tagRef = useRef<HTMLTextAreaElement>(null);

  // Fix 5: bid floor removed from form — always 0 (admin managed)
  const [form, setForm] = useState({
    siteId: "",
    name: "",
    adType: "banner",
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [unitsRes, sitesRes] = await Promise.all([
      fetch("/api/publisher/adunits"),
      fetch("/api/publisher/sites"),
    ]);
    const units = await unitsRes.json();
    const sitesData = await sitesRes.json();
    setAdUnits(Array.isArray(units) ? units : []);
    setSites(Array.isArray(sitesData) ? sitesData : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function addUnit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/publisher/adunits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Fix 5: bidFloor always 0 — not set by publisher
      body: JSON.stringify({ ...form, bidFloor: 0 }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setAddOpen(false);
    setForm({ siteId: "", name: "", adType: "banner" });
    fetchAll();
    setSaving(false);
  }

  async function deleteUnit(adUnitId: string) {
    if (!confirm("Delete this ad unit?")) return;
    await fetch("/api/publisher/adunits", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adUnitId }),
    });
    fetchAll();
  }

  // Fix 6: Open tag modal + copy with robust fallback
  function openTagModal(unit: AdUnit) {
    const tag = `<script src="${window.location.origin}/api/tag/${unit.id}" async></script>`;
    setTagModal({ open: true, tag, unitId: unit.id });
  }

  async function copyTag(text: string, key: string) {
    try {
      await copyToClipboard(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 2500);
    } catch {
      // Last resort: select the textarea so user can Ctrl+C
      tagRef.current?.select();
      setCopied("select");
      setTimeout(() => setCopied(""), 3000);
    }
  }

  function parseSizes(s: string): string {
    try {
      const arr = JSON.parse(s) as number[][];
      return arr.map((size) => size.join("x")).join(", ");
    } catch { return s; }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Units</h1>
          <p className="text-gray-500 text-sm mt-1">Manage banner and video ad units</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} /> New ad unit
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : adUnits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Code2 size={40} className="mx-auto mb-3 opacity-40" />
            <p>No ad units yet. Create one and grab the tag to place on your site.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Site</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sizes</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{unit.name}</td>
                  <td className="px-4 py-3 text-gray-500">{unit.site.domain}</td>
                  <td className="px-4 py-3">
                    <Badge variant={unit.adType === "video" ? "info" : "gray"}>
                      {unit.adType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{parseSizes(unit.sizes)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={unit.status === "active" ? "success" : "gray"}>
                      {unit.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* Fix 6: Get Tag button opens modal */}
                      <button
                        onClick={() => openTagModal(unit)}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <Code2 size={12} />
                        Get tag
                      </button>
                      <button
                        onClick={() => deleteUnit(unit.id)}
                        className="text-red-400 hover:text-red-600 p-1.5"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Ad Unit Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create ad unit">
        <form onSubmit={addUnit} className="space-y-4">
          <Select
            label="Site"
            value={form.siteId}
            onChange={(e) => setForm({ ...form, siteId: e.target.value })}
            required
          >
            <option value="">Select a site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>
            ))}
          </Select>
          <Input
            label="Ad unit name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Header Banner"
            required
          />
          <Select
            label="Ad type"
            value={form.adType}
            onChange={(e) => setForm({ ...form, adType: e.target.value })}
          >
            <option value="banner">Banner</option>
            <option value="video">Video</option>
          </Select>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Default sizes:</p>
            {form.adType === "banner"
              ? BANNER_SIZES.map((s) => <span key={s} className="mr-2">{s}</span>)
              : VIDEO_SIZES.map((s) => <span key={s} className="mr-2">{s}</span>)
            }
          </div>
          {/* Fix 5: Bid floor field REMOVED — admin manages it */}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Fix 6: Ad Tag Modal — shows tag + copy button + textarea fallback */}
      <Modal
        open={tagModal.open}
        onClose={() => setTagModal({ open: false, tag: "", unitId: "" })}
        title="Ad Tag"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Copy this script tag and paste it on your website where you want the ad to appear.
          </p>

          {/* Tag display */}
          <div className="bg-gray-900 rounded-lg p-4">
            <textarea
              ref={tagRef}
              readOnly
              value={tagModal.tag}
              rows={3}
              className="w-full bg-transparent text-green-400 text-xs font-mono resize-none outline-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>

          {/* Copy button */}
          <Button
            className="w-full"
            onClick={() => copyTag(tagModal.tag, tagModal.unitId)}
          >
            {copied === tagModal.unitId ? (
              <><CheckCircle size={15} /> Copied to clipboard!</>
            ) : copied === "select" ? (
              <><Copy size={15} /> Text selected — press Ctrl+C</>
            ) : (
              <><Copy size={15} /> Copy tag</>
            )}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
            <strong>How to use:</strong> Paste this script tag inside the{" "}
            <code className="bg-blue-100 px-1 rounded">&lt;body&gt;</code> of your page where you want the ad shown.
            The tag loads asynchronously — it will not slow down your page.
          </div>
        </div>
      </Modal>
    </div>
  );
}
