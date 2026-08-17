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
  const divId = `yp-ad-${adUnit.id}`;

  // Build oRTB bidder configs for Prebid
  const ortbBidders = ortbSources
    .filter((s) => s.mediaTypes.split(",").includes(isVideo ? "video" : "banner"))
    .map((s) => ({
      bidder: "openx", // generic placeholder; real integration uses bidder-specific adapters
      params: { unit: s.id, delDomain: new URL(s.endpoint).hostname },
    }));

  const videoMediaType = isVideo
    ? `video: {
          playerSize: ${JSON.stringify(sizes)},
          context: 'instream',
          mimes: ['video/mp4','video/webm'],
          protocols: [1,2,3,4,5,6],
          playbackmethod: [1,2],
          maxduration: 30,
          api: [1,2]
        }`
    : "";

  const bannerMediaType = !isVideo
    ? `banner: { sizes: ${JSON.stringify(sizes)} }`
    : "";

  const tag = `
<!-- YieldProsper Ad Tag | Unit: ${adUnit.name} | Site: ${adUnit.site.domain} -->
<div id="${divId}"></div>
<script>
(function() {
  var PREBID_TIMEOUT = 1500;
  var FAILSAFE_TIMEOUT = 2200;

  var adUnits = [{
    code: '${divId}',
    mediaTypes: {
      ${bannerMediaType}${videoMediaType}
    },
    bids: [
      {
        bidder: 'omnidex',
        params: {
          cId: '${cId}',
          pId: '${OMNIDEX_PID}',
          bidFloor: ${adUnit.bidFloor || 0}
        }
      }
      ${ortbBidders.length > 0 ? "," + ortbBidders.map(b => JSON.stringify(b)).join(",") : ""}
    ]
  }];

  function initAdServer() {
    if (window.pbjs && window.pbjs.initAdserverSet) return;
    if (window.pbjs) window.pbjs.initAdserverSet = true;

    window.pbjs = window.pbjs || {};
    window.pbjs.que = window.pbjs.que || [];

    window.pbjs.que.push(function() {
      window.pbjs.addAdUnits(adUnits);

      window.pbjs.requestBids({
        timeout: PREBID_TIMEOUT,
        bidsBackHandler: function(bidResponses) {
          var bids = window.pbjs.getHighestCpmBids('${divId}');
          if (bids && bids.length > 0) {
            var winner = bids[0];
            window.pbjs.renderAd(document, winner.adId);
          } else {
            // oRTB fallback: try demand sources in priority order
            tryOrtbFallback(0);
          }
        }
      });
    });
  }

  function tryOrtbFallback(index) {
    var sources = ${JSON.stringify(
      ortbSources.map((s) => ({
        name: s.name,
        endpoint: s.endpoint,
        timeout: s.timeout,
        floorCpm: s.floorCpm,
      }))
    )};

    if (index >= sources.length) {
      // No fill — render empty placeholder
      renderNoFill();
      return;
    }

    var src = sources[index];
    var bidReq = {
      id: '${adUnit.id}-' + Date.now(),
      imp: [{
        id: '1',
        ${isVideo ? `video: { w: ${sizes[0]?.[0] || 640}, h: ${sizes[0]?.[1] || 480}, mimes: ['video/mp4'] }` : `banner: { w: ${sizes[0]?.[0] || 300}, h: ${sizes[0]?.[1] || 250} }`},
        bidfloor: src.floorCpm
      }],
      site: {
        domain: '${adUnit.site.domain}',
        page: window.location.href
      },
      at: 1
    };

    fetch(src.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-openrtb-version': '2.5' },
      body: JSON.stringify(bidReq),
      signal: AbortSignal.timeout(src.timeout)
    })
    .then(function(r) { return r.json(); })
    .then(function(resp) {
      if (resp && resp.seatbid && resp.seatbid.length > 0) {
        var bids = resp.seatbid[0].bid;
        if (bids && bids.length > 0) {
          var best = bids.reduce(function(a, b) { return b.price > a.price ? b : a; });
          if (best.price >= src.floorCpm) {
            renderOrtbAd(best.adm);
            return;
          }
        }
      }
      tryOrtbFallback(index + 1);
    })
    .catch(function() {
      tryOrtbFallback(index + 1);
    });
  }

  function renderOrtbAd(adm) {
    var el = document.getElementById('${divId}');
    if (!el) return;
    var iframe = document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.width = '${sizes[0]?.[0] || 300}px';
    iframe.style.height = '${sizes[0]?.[1] || 250}px';
    iframe.srcdoc = adm;
    el.appendChild(iframe);
  }

  function renderNoFill() {
    var el = document.getElementById('${divId}');
    if (el) el.style.display = 'none';
  }

  // Load Prebid.js (proxied — real source hidden from publishers)
  if (!window._ypPrebidLoaded) {
    window._ypPrebidLoaded = true;
    var s = document.createElement('script');
    s.src = '/api/pbjs';
    s.async = true;
    s.onload = function() { initAdServer(); };
    s.onerror = function() {
      // Silent fallback — no real URL exposed
      setTimeout(function() { initAdServer(); }, 500);
    };
    document.head.appendChild(s);
  } else {
    initAdServer();
  }

  // Failsafe: trigger oRTB if Prebid doesn't respond
  setTimeout(function() {
    if (!window.pbjs || !window.pbjs.initAdserverSet) {
      tryOrtbFallback(0);
    }
  }, FAILSAFE_TIMEOUT);

  // Configure Prebid with OmniDex userId modules + user sync
  if (window.pbjs) {
    window.pbjs.que = window.pbjs.que || [];
    window.pbjs.que.push(function() {
      window.pbjs.setConfig({
        // User ID modules (from OmniDex custom build)
        userSync: {
          syncDelay: 3000,
          auctionDelay: 300,
          filterSettings: {
            iframe: { bidders: ['omnidex'], filter: 'include' },
            image: { bidders: '*', filter: 'include' }
          },
          userIds: [
            { name: 'sharedId', storage: { name: 'pubcid', type: 'cookie', expires: 365 } },
            { name: 'unifiedId', params: { partner: 'prebid' }, storage: { name: 'unifiedid', type: 'cookie', expires: 90 } },
            { name: 'id5Id', params: { partner: 173 }, storage: { name: 'id5id', type: 'html5', expires: 90 } },
            { name: 'criteoId', storage: { name: 'criteo', type: 'cookie', expires: 365 } },
            { name: 'uid2Id', storage: { name: '__uid2_advertising_token', type: 'localStorage' } }
          ]
        }
      });
    });
  }
})();
</script>
<!-- /YieldProsper Ad Tag -->
`.trim();

  return new NextResponse(tag, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
