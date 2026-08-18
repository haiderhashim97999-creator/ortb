import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OMNIDEX_PID     = "25cv68n329154k1909176mw4";
const OMNIDEX_CID_BANNER = "6a0f24939f9529b6eec283e7";
const OMNIDEX_CID_VIDEO  = "6a0f249fb01f8a0cb9562731";
const SERVER_BASE     = "https://test.mindwellnetwork.site";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ adUnitId: string }> }
) {
  const { adUnitId } = await params;

  const adUnit = await prisma.adUnit.findFirst({
    where: { id: adUnitId, status: "active" },
    include: {
      site: {
        include: { publisher: { include: { user: true } } },
      },
    },
  });

  if (!adUnit) {
    return new NextResponse("// Ad unit not found", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  if (adUnit.site.publisher.user.status !== "active") {
    return new NextResponse("// Publisher inactive", {
      status: 403,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const sizes = (() => {
    try { return JSON.parse(adUnit.sizes); } catch { return [[300, 250]]; }
  })();

  const isVideo   = adUnit.adType === "video";
  const cid       = isVideo ? OMNIDEX_CID_VIDEO : OMNIDEX_CID_BANNER;
  const adW       = sizes[0]?.[0] || 300;
  const adH       = sizes[0]?.[1] || 250;

  const tag = `(function () {
  'use strict';

  var PID       = '${OMNIDEX_PID}';
  var CID       = '${cid}';
  var AD_ID     = '${adUnit.id}';
  var AD_W      = ${adW};
  var AD_H      = ${adH};
  var IS_VIDEO  = ${isVideo};
  var SIZES     = ${JSON.stringify(sizes)};
  var TIMEOUT   = 5000;
  var SERVER    = '${SERVER_BASE}';
  var PBJS_WAIT_MAX = 10000;
  var PBJS_WAIT_INTERVAL = 100;

  /* ── 1. Create ad container ───────────────────────────────── */
  var slotId = 'yp-' + AD_ID.slice(-8) + '-' + Math.random().toString(36).substr(2,4);

  var container = document.createElement('div');
  container.id = slotId;
  container.style.cssText = 'display:block;width:' + AD_W + 'px;max-width:100%;overflow:hidden;margin:4px auto;';

  var me = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  if (me && me.parentNode) {
    me.parentNode.insertBefore(container, me.nextSibling);
  } else {
    document.body.appendChild(container);
  }

  /* ── 2. Prebid ad unit ────────────────────────────────────── */
  var adUnit = IS_VIDEO
    ? {
        code: slotId,
        mediaTypes: { video: { context: 'outstream', playerSize: SIZES } },
        bids: [{ bidder: 'omnidex', params: { pid: PID, cid: CID } }]
      }
    : {
        code: slotId,
        mediaTypes: { banner: { sizes: SIZES } },
        bids: [{ bidder: 'omnidex', params: { pid: PID, cid: CID } }]
      };

  /* ── 3. Render ────────────────────────────────────────────── */
  function renderSlot() {
    var el = document.getElementById(slotId);
    if (!el) return;

    var best = window.pbjs && window.pbjs.getHighestCpmBids(slotId)[0];
    if (!best) { el.style.display = 'none'; return; }

    el.style.display = '';
    el.innerHTML = '';

    if (best.mediaType === 'video' && best.renderer) {
      try { best.renderer.render(best); } catch (e) { renderBannerIframe(el, best); }
    } else {
      renderBannerIframe(el, best);
    }
  }

  function renderBannerIframe(el, bid) {
    var iframe = document.createElement('iframe');
    iframe.frameBorder = '0';
    iframe.scrolling   = 'no';
    iframe.width  = bid.width  || AD_W;
    iframe.height = bid.height || AD_H;
    iframe.style.cssText = 'border:none;display:block;';
    el.appendChild(iframe);
    try {
      var doc = iframe.contentWindow.document;
      doc.open(); doc.write(bid.ad); doc.close();
    } catch (e) {
      window.pbjs.renderAd(iframe.contentWindow.document, bid.adId);
    }
  }

  /* ── 4. Wait for Prebid then request bids ─────────────────── */
  function waitForPrebid(cb) {
    var elapsed = 0;
    if (window.pbjs && typeof window.pbjs.addAdUnits === 'function') { cb(); return; }
    var iv = setInterval(function () {
      elapsed += PBJS_WAIT_INTERVAL;
      if (window.pbjs && typeof window.pbjs.addAdUnits === 'function') {
        clearInterval(iv); cb();
      } else if (elapsed >= PBJS_WAIT_MAX) {
        clearInterval(iv);
      }
    }, PBJS_WAIT_INTERVAL);
  }

  function requestAd() {
    window.pbjs = window.pbjs || {};
    window.pbjs.que = window.pbjs.que || [];

    waitForPrebid(function () {
      window.pbjs.que.push(function () {
        window.pbjs.setConfig({
          bidderTimeout: TIMEOUT,
          enableTIDs: true,
          deviceAccess: true
        });
        window.pbjs.bidderSettings = { '*': { storageAllowed: true } };

        window.pbjs.addAdUnits([adUnit]);
        window.pbjs.requestBids({
          adUnits: [adUnit],
          bidsBackHandler: function () { renderSlot(); }
        });
      });
    });
  }

  /* ── 5. Load Prebid.js from our server ────────────────────── */
  window.pbjs = window.pbjs || {};
  window.pbjs.que = window.pbjs.que || [];
  window.pbjs.distUrlBase = SERVER + '/';

  if (!window._ypPbjsLoaded) {
    window._ypPbjsLoaded = true;
    var s = document.createElement('script');
    s.src   = SERVER + '/api/pbjs';
    s.async = true;
    s.onload  = function () { requestAd(); };
    s.onerror = function () { /* no fill silently */ };
    document.head.appendChild(s);
  } else {
    requestAd();
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
