"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Key, Globe, CreditCard, DollarSign, Building2 } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  apiKey: string;
  publisher?: {
    companyName: string;
    website: string;
    sellerId: string;
    sites: { id: string; name: string; domain: string }[];
  };
}

interface PaymentProfile {
  method: string;
  accountName: string;
  accountDetail: string;
  bankName: string;
  country: string;
  minPayout: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [copied, setCopied] = useState("");

  // Payment profile state (stored locally — admin sets actual payouts)
  const [payment, setPayment] = useState<PaymentProfile>({
    method: "crypto",
    accountName: "",
    accountDetail: "",
    bankName: "",
    country: "",
    minPayout: "$100",
  });
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setUser);
    // Load saved payment profile from localStorage
    const saved = localStorage.getItem("yp_payment_profile");
    if (saved) {
      try { setPayment(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  function copy(text: string, key: string) {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  async function savePayment(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayment(true);
    // Save to localStorage + send to admin API for record
    localStorage.setItem("yp_payment_profile", JSON.stringify(payment));
    await fetch("/api/publisher/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payment),
    }).catch(() => {/* non-critical */});
    setPaymentSaved(true);
    setSavingPayment(false);
    setTimeout(() => setPaymentSaved(false), 3000);
  }

  if (!user) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Account, payment and integration details</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            ["Name", user.name],
            ["Email", user.email],
            ...(user.publisher ? [["Company", user.publisher.companyName]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-gray-500">{k}</span>
              <span className="font-medium text-gray-900">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Revenue Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={16} />Revenue Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-700 text-xs">
            Revenue is calculated and paid out by YieldProsper admin based on your ad performance.
            Payment is processed once your balance reaches the minimum threshold.
            Contact <strong>payments@yieldpros.website</strong> for balance inquiries.
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Minimum payout</span>
            <span className="font-medium text-gray-900">$100.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment cycle</span>
            <span className="font-medium text-gray-900">Monthly (NET-60)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Contact for payment</span>
            <span className="font-medium text-indigo-600">payments@yieldpros.website</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={16} />Payment Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePayment} className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-yellow-800 text-xs flex items-start gap-2">
              <span className="text-base">💰</span>
              <span>Payments are made in <strong>USDT / USDC via BNB BEP20</strong> network only. Please provide your BEP20 wallet address.</span>
            </div>

            <Input
              label="Account holder name"
              value={payment.accountName}
              onChange={(e) => setPayment({ ...payment, accountName: e.target.value })}
              placeholder="Your full name"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet address <span className="text-indigo-600 font-semibold">(BNB BEP20)</span>
              </label>
              <input
                type="text"
                value={payment.accountDetail}
                onChange={(e) => setPayment({ ...payment, accountDetail: e.target.value })}
                placeholder="0x... (BEP20 wallet address)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Only BNB Smart Chain (BEP20) network. Sending to wrong network will result in loss of funds.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" loading={savingPayment} size="sm">
                Save payment profile
              </Button>
              {paymentSaved && (
                <span className="text-green-600 text-sm font-medium">✓ Saved</span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Your wallet address is encrypted and only visible to YieldProsper admin for processing payouts.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key size={16} />API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
            <code className="flex-1 text-sm text-gray-700 font-mono truncate">{user.apiKey}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(user.apiKey, "apikey")}>
              <Copy size={13} />
              {copied === "apikey" ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Use this key when accessing the reporting API directly.</p>
        </CardContent>
      </Card>

      {/* Sellers.json */}
      {user.publisher && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 size={16} />Sellers.json</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Seller ID</span>
              <div className="flex items-center gap-2">
                <code className="text-gray-700 font-mono text-xs">{user.publisher.sellerId}</code>
                <Button size="sm" variant="ghost" onClick={() => copy(user.publisher!.sellerId, "seller")}>
                  <Copy size={12} />
                  {copied === "seller" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Network sellers.json</span>
              <a href="/api/sellers.json" target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 text-xs underline">
                /api/sellers.json
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ads.txt per site */}
      {user.publisher?.sites && user.publisher.sites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe size={16} />ads.txt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">
              Place at root of each domain as <code className="bg-gray-100 px-1 rounded">ads.txt</code>:
            </p>
            {user.publisher.sites.map((site) => (
              <div key={site.id} className="bg-gray-50 rounded-lg px-3 py-2.5">
                <p className="text-xs text-gray-400 mb-1">{site.domain}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-gray-700 font-mono truncate">
                    {typeof window !== "undefined" ? window.location.origin : ""}/api/ads-txt/{site.domain}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copy(`${window.location.origin}/api/ads-txt/${site.domain}`, site.id)}
                  >
                    <Copy size={12} />
                    {copied === site.id ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
