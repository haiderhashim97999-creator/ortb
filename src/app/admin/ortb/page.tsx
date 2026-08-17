"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Zap, Info } from "lucide-react";

interface OrtbSource {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  timeout: number;
  active: boolean;
  priority: number;
  mediaTypes: string;
  floorCpm: number;
  createdAt: string;
}

const EMPTY_FORM = {
  name: "", endpoint: "", apiKey: "", timeout: "300",
  priority: "1", mediaTypes: "banner,video", floorCpm: "0.0",
};

export default function OrtbPage() {
  const [sources, setSources] = useState<OrtbSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editSource, setEditSource] = useState<OrtbSource | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSources = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/ortb");
    const data = await res.json();
    setSources(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditSource(null);
    setError("");
    setAddOpen(true);
  }

  function openEdit(src: OrtbSource) {
    setEditSource(src);
    setForm({
      name: src.name,
      endpoint: src.endpoint,
      apiKey: src.apiKey,
      timeout: src.timeout.toString(),
      priority: src.priority.toString(),
      mediaTypes: src.mediaTypes,
      floorCpm: src.floorCpm.toString(),
    });
    setError("");
    setAddOpen(true);
  }

  async function saveSource(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      endpoint: form.endpoint,
      apiKey: form.apiKey,
      timeout: parseInt(form.timeout) || 300,
      priority: parseInt(form.priority) || 1,
      mediaTypes: form.mediaTypes,
      floorCpm: parseFloat(form.floorCpm) || 0,
    };

    const res = await fetch("/api/admin/ortb", {
      method: editSource ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editSource ? { id: editSource.id, ...payload } : payload),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }
    setAddOpen(false);
    fetchSources();
    setSaving(false);
  }

  async function toggleActive(src: OrtbSource) {
    await fetch("/api/admin/ortb", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: src.id, active: !src.active }),
    });
    fetchSources();
  }

  async function deleteSource(id: string) {
    if (!confirm("Delete this demand source?")) return;
    await fetch("/api/admin/ortb", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchSources();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">oRTB Demand Sources</h1>
          <p className="text-gray-500 text-sm mt-1">Configure fallback OpenRTB demand partners</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} /> Add demand source
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-700">
        <Info size={18} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">How oRTB fallback works</p>
          <p className="text-blue-600">
            When the demand partner returns no bid, the ad tag tries each active oRTB source in priority order (lower number = higher priority).
            The highest CPM response above the floor wins. If no source fills, the ad slot is hidden.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : sources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Zap size={40} className="mx-auto mb-3 opacity-40" />
            <p>No oRTB demand sources. Add one to enable fallback monetization.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Endpoint</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Priority</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Media</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Floor CPM</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Timeout</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sources.map((src) => (
                <tr key={src.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{src.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{src.endpoint}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{src.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {src.mediaTypes.split(",").map((m) => (
                        <Badge key={m} variant={m === "video" ? "info" : "gray"}>{m}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">${src.floorCpm.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{src.timeout}ms</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(src)}>
                      <Badge variant={src.active ? "success" : "gray"}>
                        {src.active ? "Active" : "Paused"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(src)} className="text-gray-400 hover:text-indigo-600 p-1.5">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteSource(src.id)} className="text-red-400 hover:text-red-600 p-1.5">
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

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={editSource ? "Edit demand source" : "Add oRTB demand source"}
      >
        <form onSubmit={saveSource} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Demand Partner Name" required />
          <Input label="oRTB endpoint URL" value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} placeholder="https://rtb.partner.com/openrtb2/auction" required />
          <Input label="API Key (optional)" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="Bearer token or API key" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Priority (1=highest)" type="number" min="1" max="99" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            <Input label="Timeout (ms)" type="number" min="100" max="2000" value={form.timeout} onChange={(e) => setForm({ ...form, timeout: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Media types" value={form.mediaTypes} onChange={(e) => setForm({ ...form, mediaTypes: e.target.value })}>
              <option value="banner,video">Banner + Video</option>
              <option value="banner">Banner only</option>
              <option value="video">Video only</option>
            </Select>
            <Input label="Floor CPM ($)" type="number" step="0.01" min="0" value={form.floorCpm} onChange={(e) => setForm({ ...form, floorCpm: e.target.value })} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>{editSource ? "Save changes" : "Add source"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
