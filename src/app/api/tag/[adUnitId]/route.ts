import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OMNIDEX_PID = "25cv68n329154k1909176mw4";
const OMNIDEX_CID_DISPLAY = "6a0f24939f9529b6eec283e7";
const OMNIDEX_CID_VIDEO = "6a0f249fb01f8a0cb9562731";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ adUnitId: string }> }
) {
  const { adUnitId } = await params;

  const adUnit = await prisma.adUnit.findFirst({
    where: { id: adUnitId, status: "active" },
    include: {
      site: {
        include: {
          publisher: { include: { user: true } },
        },
      },
    },
  });

  if (!adUnit) {
    return new NextResponse("// Ad unit not found", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const publisher = adUnit.site.publisher;
  const user = publisher.user;

  if (user.status !== "active") {
    return new NextResponse("// Publisher account inactive", {
      status: 403,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  // Fetch active oRTB demand sources as fallback
  const ortbSources = await prisma.ortbDemandSource.findMany({
    where: { active: true },
    orderBy: { priority: "asc" },
  });

  const sizes = (() => {
    try { return JSON.parse(adUnit.sizes); } catch { return [[300, 250]]; }
  })();

  const isVideo = adUnit.adType === "video";
  const cId = isVideo ? OMNIDEX_CID_VIDEO : OMNIDEX_CID_DISPLAY;

  // Build oRTB bidder configs for Prebid
  const ortbBidders = ortbSources
    .filter((s) => s.mediaTypes.split(",").includes(isVideo ? "video" : "banner"))
    .map((s) => ({
      bidder: "openx",
      params: { unit: s.id, delDomain: new URL(s.endpoint).hostname },
    }));

  const adWidth = sizes[0]?.[0] || 300;
  const adHeight = sizes[0]?.[1] || 250;

  const tag = `(function() {
  // ── YieldProsper Ad | ${adUnit.name} ──────────────────────────
  var AD_UNIT_ID  = '${adUnit.id}';
  var DIV_ID      = 'yp-${adUnit.id.slice(-8)}';
  var AD_W        = ${adWidth};
  var AD_H        = ${adHeight};
  var IS_VIDEO    = ${isVideo};
  var CID         = '${cId}';
  var PID         = '${OMNIDEX_PID}';
  var BID_FLOOR   = ${adUnit.bidFloor || 0};
  var PBJS_TIMEOUT  = 1500;
  var FAILSAFE_MS   = 2500;
  var SERVER        = 'https://test.mindwellnetwork.site';

  // ── 1. Create & inject ad container div ───────────────────────
  var container = document.createElement('div');
  container.id = DIV_ID;
  container.style.cssText = 'display:block;width:' + AD_W + 'px;max-width:100%;margin:0 auto;overflow:hidden;';

  // Place div right after the <script> tag that loaded this file
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  if (currentScript && currentScript.parentNode) {
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
  } else {
    document.body.appendChild(container);
  }

  // ── 2. Prebid ad units config ─────────────────────────────────
  var adUnits = [{
    code: DIV_ID,
    mediaTypes: IS_VIDEO
      ? { video: { playerSize: [[AD_W, AD_H]], context: 'instream', mimes: ['video/mp4','video/webm'], protocols: [1,2,3,4,5,6], playbackmethod: [1,2], maxduration: 30, api: [1,2] } }
      : { banner: { sizes: ${JSON.stringify(sizes)} } },
    bids: [{
      bidder: 'omnidex',
      params: { cId: CID, pId: PID, bidFloor: BID_FLOOR }
    }${ortbBidders.length > 0 ? "," + ortbBidders.map(b => JSON.stringify(b)).join(",") : ""}]
  }];

  // ── 3. Render helpers ─────────────────────────────────────────
  function renderOrtbAd(adm) {
    var el = document.getElementById(DIV_ID);
    if (!el) return;
    var iframe = document.createElement('iframe');
    iframe.style.cssText = 'border:none;width:' + AD_W + 'px;height:' + AD_H + 'px;';
    iframe.scrolling = 'no';
    iframe.srcdoc = adm;
    el.appendChild(iframe);
  }

  function renderNoFill() {
    var el = document.getElementById(DIV_ID);
    if (el) el.style.display = 'none';
  }

  // ── 4. oRTB fallback ──────────────────────────────────────────
  var ORTB_SOURCES = ${JSON.stringify(ortbSources.map((s) => ({ endpoint: s.endpoint, timeout: s.timeout, floorCpm: s.floorCpm })))};

  function tryOrtbFallback(index) {
    if (index >= ORTB_SOURCES.length) { renderNoFill(); return; }
    var src = ORTB_SOURCES[index];
    var req = {
      id: AD_UNIT_ID + '-' + Date.now(),
      imp: [{ id: '1', banner: { w: AD_W, h: AD_H }, bidfloor: src.floorCpm }],
      site: { domain: '${adUnit.site.domain}', page: window.location.href },
      at: 1
    };
    fetch(src.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-openrtb-version': '2.5' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(src.timeout)
    })
    .then(function(r) { return r.json(); })
    .then(function(resp) {
      if (resp && resp.seatbid && resp.seatbid[0] && resp.seatbid[0].bid && resp.seatbid[0].bid.length) {
        var best = resp.seatbid[0].bid.reduce(function(a,b){ return b.price > a.price ? b : a; });
        if (best.price >= src.floorCpm) { renderOrtbAd(best.adm); return; }
      }
      tryOrtbFallback(index + 1);
    })
    .catch(function() { tryOrtbFallback(index + 1); });
  }

  // ── 5. Prebid init ────────────────────────────────────────────
  function initPrebid() {
    if (window.pbjs && window.pbjs._ypInit) return;
    window.pbjs = window.pbjs || {};
    window.pbjs.que = window.pbjs.que || [];
    if (window.pbjs._ypInit) return;
    window.pbjs._ypInit = true;

    window.pbjs.que.push(function() {
      window.pbjs.setConfig({
        userSync: {
          syncDelay: 3000, auctionDelay: 300,
          filterSettings: {
            iframe: { bidders: ['omnidex'], filter: 'include' },
            image:  { bidders: '*', filter: 'include' }
          }
        }
      });
      window.pbjs.addAdUnits(adUnits);
      window.pbjs.requestBids({
        timeout: PBJS_TIMEOUT,
        bidsBackHandler: function() {
          var bids = window.pbjs.getHighestCpmBids(DIV_ID);
          if (bids && bids.length > 0) {
            window.pbjs.renderAd(document, bids[0].adId);
          } else {
            tryOrtbFallback(0);
          }
        }
      });
    });
  }

  // Failsafe if Prebid never fires
  var failsafeTimer = setTimeout(function() {
    tryOrtbFallback(0);
  }, FAILSAFE_MS);

  // ── 6. Load Prebid.js ─────────────────────────────────────────
  if (!window._ypPbjsLoaded) {
    window._ypPbjsLoaded = true;
    var s = document.createElement('script');
    s.src = SERVER + '/api/pbjs';
    s.async = true;
    s.onload  = function() { clearTimeout(failsafeTimer); initPrebid(); };
    s.onerror = function() { clearTimeout(failsafeTimer); tryOrtbFallback(0); };
    document.head.appendChild(s);
  } else {
    clearTimeout(failsafeTimer);
    initPrebid();
  }
})();`;

  return new NextResponse(tag, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
