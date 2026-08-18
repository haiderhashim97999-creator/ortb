/**
 * Prebid.js Proxy — hides the real source URL from publishers.
 * Fetches from the private origin and re-serves with generic headers.
 * Publishers only see: /api/pbjs
 *
 * Build includes:
 *  - adagioBidAdapter     (Adagio client adapter)
 *  - rtdModule            (Real Time Data module — required for Adagio RTD)
 *  - adagioRtdProvider    (Adagio RTD provider — viewability & attention prediction)
 *  - consentManagement    (GDPR/TCF compliance — required by Adagio)
 *  - consentManagementUsp (CCPA compliance)
 */
import { NextResponse } from "next/server";

// Prebid.js — not-for-prod build from official Prebid CDN
// Includes ALL adapters including adagioBidAdapter, rtdModule, adagioRtdProvider
// NOTE: not-for-prod build is for testing only, replace with custom build for production
const PREBID_SOURCE = "https://cdn.jsdelivr.net/npm/prebid.js@9.51.0/dist/not-for-prod/prebid.js";

// Cache in memory for 6 hours
let cachedContent: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  // Serve from in-memory cache if still fresh
  if (cachedContent && now - cachedAt < CACHE_TTL_MS) {
    return buildResponse(cachedContent);
  }

  try {
    const res = await fetch(PREBID_SOURCE, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; YieldProsper/1.0)",
        Accept: "application/javascript, text/javascript, */*",
      },
      // Next.js fetch cache — revalidate every 6 hours on the server side too
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      throw new Error(`Upstream returned ${res.status}`);
    }

    const text = await res.text();
    cachedContent = text;
    cachedAt = now;

    return buildResponse(text);
  } catch (err) {
    console.error("[pbjs proxy] fetch failed:", err);
    // Return a no-op stub so the page doesn't break
    return new NextResponse(
      `/* prebid.js loader error — retrying next request */\nwindow.pbjs=window.pbjs||{que:[]};`,
      {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

function buildResponse(content: string) {
  return new NextResponse(content, {
    status: 200,
    headers: {
      // Generic content-type — nothing leaks the real URL
      "Content-Type": "application/javascript; charset=utf-8",
      // Cache on CDN / browser for 6 hours
      "Cache-Control": "public, max-age=21600, s-maxage=21600, stale-while-revalidate=3600",
      // Allow cross-origin (needed for publisher sites loading the tag)
      "Access-Control-Allow-Origin": "*",
      // Do NOT include a source map header or X-Source-URL
      // Vary ensures different cached responses per Accept-Encoding
      Vary: "Accept-Encoding",
    },
  });
}
