"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Code2, CheckCircle, Info } from "lucide-react";

interface AdUnit {
  id: string;
  name: string;
  adType: string;
  sizes: string;
  bidFloor: number;
  status: string;
  site: { domain: string; name: string };
}

export default function AdUnitDetailPage() {
  const { id } = useParams() as { id: string };
  const [adUnit, setAdUnit] = useState<AdUnit | null>(null);
  const [copied, setCopied] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com";

  useEffect(() => {
    fetch(`/api/publisher/adunits?siteId=`)
      .then((r) => r.json())
      .then((data) => {
        const found = Array.isArray(data) ? data.find((u: AdUnit) => u.id === id) : null;
        setAdUnit(found || null);
      });
  }, [id]);

  if (!adUnit) return <div className="p-6 text-gray-400">Loading...</div>;

  const scriptTag = `<script src="${origin}/api/tag/${adUnit.id}" async></script>`;

  const wordpressGuide = `Step 1: Install "WPCode" plugin (WordPress.org se free mein)
Step 2: WP Admin → WPCode → + Add Snippet → HTML Snippet
Step 3: Neeche diya hua code paste karo
Step 4: Location: "Insert After Post" ya "Insert in Footer" select karo
Step 5: Activate karo → Save karo

Bas! Ad automatically apni jagah pe show hoga.
Alag se koi div add karne ki zaroorat nahi.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<script src="${origin}/api/tag/${adUnit.id}" async></script>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  function parseSizes(s: string) {
    try { return JSON.parse(s).map((x: number[]) => x.join("x")).join(", "); }
    catch { return s; }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ad Unit Integration</h1>
        <p className="text-gray-500 text-sm mt-1">{adUnit.name} — {adUnit.site.domain}</p>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Type", adUnit.adType],
          ["Sizes", parseSizes(adUnit.sizes)],
          ["Floor CPM", `$${adUnit.bidFloor.toFixed(2)}`],
          ["Status", adUnit.status],
        ].map(([k, v]) => (
          <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400">{k}</p>
            <p className="text-sm font-semibold text-gray-800">{v}</p>
          </div>
        ))}
      </div>

      {/* Prebid info */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 text-sm text-indigo-700">
        <Info size={18} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">oRTB Header Bidding — Enabled</p>
          <p className="text-indigo-600 text-xs leading-relaxed">
            This tag automatically loads the header bidding library with oRTB support.
            Bidder type: <code className="bg-indigo-100 px-1 rounded">oRTB</code> |
            GVL: 1463 | Sync enabled
          </p>
        </div>
      </div>

      {/* Script tag */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 size={16} />
            Your Ad Tag — Sirf Yeh Ek Line Chahiye
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {scriptTag}
            </pre>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => copy(scriptTag, "script")}
          >
            {copied === "script" ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy Tag</>}
          </Button>
          <p className="text-xs text-green-600 font-medium mt-2">
            ✓ Sirf yeh ek script tag add karo — ad div automatically create ho jata hai
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Koi alag div add karne ki zaroorat nahi. Script jahan bhi add hogi, ad wahin show hoga.
          </p>
        </CardContent>
      </Card>

      {/* WordPress Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info size={16} />
            WordPress Pe Kaise Add Karein
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 max-h-80 overflow-auto">
            <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
              {wordpressGuide}
            </pre>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => copy(scriptTag, "wp")}
          >
            {copied === "wp" ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy Script</>}
          </Button>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader><CardTitle>How the bidding works</CardTitle></CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <div className="flex items-start gap-2">
            <Badge variant="info" className="mt-0.5 flex-shrink-0">1</Badge>
            <p>Page loads the YieldProsper ad tag, which initializes the oRTB bidding engine</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="info" className="mt-0.5 flex-shrink-0">2</Badge>
            <p>oRTB bid request sent to demand partners via header bidding (highest CPM wins)</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="info" className="mt-0.5 flex-shrink-0">3</Badge>
            <p>If primary demand returns a bid, it&apos;s rendered directly. The highest CPM wins.</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="warning" className="mt-0.5 flex-shrink-0">4</Badge>
            <p>If no bid comes within 1.5s, oRTB fallback demand sources are tried in priority order (configured by admin)</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="gray" className="mt-0.5 flex-shrink-0">5</Badge>
            <p>If no demand source fills, the ad slot is hidden gracefully (no empty iframe)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
