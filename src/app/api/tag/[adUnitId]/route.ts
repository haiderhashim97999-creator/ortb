import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OMNIDEX_PID        = "25cv68n329154k1909176mw4";
const OMNIDEX_CID_BANNER = "6a0f24939f9529b6eec283e7";
const OMNIDEX_CID_VIDEO  = "6a0f249b01f8a0cb9562731";
const SERVER_BASE        = "https://test.mindwellnetwork.site";

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

  var PID    = '${OMNIDEX_PID}';
  var CID    = '${cid}';
  var AD_ID  = '${adUnit.id}';
  var AD_W   = ${adW};
  var AD_H   = ${adH};
  var SIZES  = ${JSON.stringify(sizes)};
  var SERVER = '${SERVER_BASE}';
  var TIMEOUT = 5000;

  /* ─── Step 1: inject container div right after this script tag ─── */
  var _me = document.currentScript || (function(){
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

  var slotId = 'yp-' + AD_ID.slice(-8);
  while (document.getElementById(slotId)) { slotId += '0'; }

  var _div = document.createElement('div');
  _div.id = slotId;
  _div.style.cssText = 'width:' + AD_W + 'px;max-width:100%;overflow:hidden;';
  _me.parentNode.insertBefore(_div, _me.nextSibling);

  /* ─── Step 2: render function (same logic as pub-vibe) ─────────── */
  function renderSlot() {
    var el = document.getElementById(slotId);
    if (!el) return;

    var bid = window.pbjs.getHighestCpmBids(slotId)[0];
    if (!bid) { el.style.display = 'none'; return; }

    el.innerHTML = '';
    el.style.display = 'block';

    var iframe = document.createElement('iframe');
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.width  = bid.width  || AD_W;
    iframe.height = bid.height || AD_H;
    iframe.style.cssText = 'border:none;display:block;';
    el.appendChild(iframe);

    var doc = iframe.contentWindow.document;
    doc.open();
    doc.write(bid.ad);
    doc.close();
  }

  /* ─── Step 3: wait for pbjs then request bids ───────────────────── */
  function runAuction() {
    window.pbjs.que.push(function () {
      window.pbjs.setConfig({
        bidderTimeout: TIMEOUT,
        enableTIDs: true,
        deviceAccess: true
      });
      window.pbjs.bidderSettings = { '*': { storageAllowed: true } };

      var adUnit = {
        code: slotId,
        mediaTypes: { banner: { sizes: SIZES } },
        bids: [{ bidder: 'omnidex', params: { pid: PID, cid: CID } }]
      };

      window.pbjs.addAdUnits([adUnit]);
      window.pbjs.requestBids({
        adUnits: [adUnit],
        bidsBackHandler: renderSlot
      });
    });
  }

  /* ─── Step 4: load prebid.js then run auction ───────────────────── */
  window.pbjs = window.pbjs || {};
  window.pbjs.que = window.pbjs.que || [];
  window.pbjs.distUrlBase = SERVER + '/';

  if (!window._ypLoaded) {
    window._ypLoaded = true;
    var s = document.createElement('script');
    s.src = SERVER + '/api/pbjs';
    s.async = true;
    s.onload = runAuction;
    document.head.appendChild(s);
  } else {
    runAuction();
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
