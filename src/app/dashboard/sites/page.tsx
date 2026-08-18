"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, statusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Globe, Plus, Trash2, Copy, ExternalLink } from "lucide-react";

interface AdUnit {
  id: string;
  name: string;
  adType: string;
}

interface Site {
  id: string;
  name: string;
  domain: string;
  status: string;
  adUnits: AdUnit[];
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const fetchSites = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/publisher/sites");
    const data = await res.json();
    setSites(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  async function addSite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/publisher/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setAddOpen(false);
    setForm({ name: "", domain: "" });
    fetchSites();
    setSaving(false);
  }

  async function deleteSite(siteId: string) {
    if (!confirm("Delete this site? All ad units will be removed.")) return;
    await fetch("/api/publisher/sites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId }),
    });
    fetchSites();
  }

  function copyAdsTxt(domain: string) {
    const url = `${window.location.origin}/api/ads-txt/${domain}`;
    navigator.clipboard.writeText(url);
    setCopied(domain);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your registered domains</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Add site
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Globe size={40} className="mx-auto mb-3 opacity-40" />
            <p>No sites yet. Add your first site to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sites.map((site) => (
            <Card key={site.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-lg mt-0.5">
                      <Globe size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{site.name}</p>
                        {statusBadge(site.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{site.domain}</p>
                      {site.status === "pending" && (
                        <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-lg mt-2">
                          ⏳ Awaiting admin approval — ad units cannot be created until approved
                        </p>
                      )}
                      {site.status === "rejected" && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg mt-2">
                          ❌ Site rejected by admin — contact support
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="info">{site.adUnits.length} ad units</Badge>
                        <Badge variant="gray">
                          {site.adUnits.filter((u) => u.adType === "banner").length} banner
                        </Badge>
                        <Badge variant="gray">
                          {site.adUnits.filter((u) => u.adType === "video").length} video
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyAdsTxt(site.domain)}
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
                      title="Copy ads.txt URL"
                    >
                      <Copy size={13} />
                      {copied === site.domain ? "Copied!" : "ads.txt"}
                    </button>
                    <a
                      href={`/api/ads-txt/${site.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 p-1.5"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      onClick={() => deleteSite(site.id)}
                      className="text-red-400 hover:text-red-600 p-1.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add new site">
        <form onSubmit={addSite} className="space-y-4">
          <Input label="Site name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My News Site" required />
          <Input label="Domain" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="mynewssite.com" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Add site</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
