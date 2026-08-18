import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Adagio Configuration ────────────────────────────────────────────────────
// organizationId: provided by Adagio (from your Adagio account dashboard)
// site: per-site slug assigned by Adagio — stored in Publisher notes or Site record
// API Key: ad77f01cfa3bc06d40ce71feb1e9c439b8baac6d
const ADAGIO_ORGANIZATION_ID = "1686";
const SERVER_BASE            = "https://test.mindwellnetwork.site";

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

  // Block pending sites — no ads until admin approves
  if (adUnit.site.status !== "active") {
    return new NextResponse("// Site pending approval", {
      status: 403,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const sizes = (() => {
    try { return JSON.parse(adUnit.sizes); } catch { return [[300, 250]]; }
  })();

  const isVideo = adUnit.adType === "video";
  const adW     = sizes[0]?.[0] || 300;
  const adH     = sizes[0]?.[1] || 250;

  // Adagio site slug — set by admin in site settings
  // Falls back to domain slug if not set
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const siteAny = adUnit.site as any;
  const adagioSite = siteAny.adagioSite ||
    adUnit.site.domain.replace(/^www\./, "").replace(/\./g, "-").replace(/[^a-z0-9-]/gi, "").toLowerCase();

  // Placement per Adagio recommended values (docs.prebid.org/dev-docs/bidders/adagio)
  const adagioPlacement = isVideo ? "video_outstream" : "banner_top";
  const pagetype        = "article";

  const tag = `(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────
  var ADAGIO_ORG_ID  = '${ADAGIO_ORGANIZATION_ID}';
  var ADAGIO_SITE    = '${adagioSite}';
  var PLACEMENT      = '${adagioPlacement}';
  var PAGETYPE       = '${pagetype}';
  var AD_ID          = '${adUnit.id}';
  var AD_W           = ${adW};
  var AD_H           = ${adH};
  var IS_VIDEO       = ${isVideo};
  var SIZES          = ${JSON.stringify(sizes)};
  var SERVER         = '${SERVER_BASE}';
  var TIMEOUT        = 5000;

  // ── Step 1: inject container div after this script tag ──────────
  var _me = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

  var slotId = 'yp-' + AD_ID.slice(-8);
  while (document.getElementById(slotId)) { slotId += '0'; }

  var _div = document.createElement('div');
  _div.id = slotId;
  _div.style.cssText = 'width:' + AD_W + 'px;max-width:100%;overflow:hidden;';
  if (_me && _me.parentNode) {
    _me.parentNode.insertBefore(_div, _me.nextSibling);
  } else {
    document.body.appendChild(_div);
  }

  // ── Step 2: render winning bid ───────────────────────────────────
  // Adagio video outstream uses its own renderer (Blue Billywig player)
  // Banner uses iframe doc.write — same as pub-vibe reference
  function renderSlot() {
    var el = document.getElementById(slotId);
    if (!el) return;

    var bid = window.pbjs.getHighestCpmBids(slotId)[0];
    if (!bid) { el.style.display = 'none'; return; }

    el.innerHTML = '';
    el.style.display = 'block';

    // Video outstream: Adagio adapter includes Blue Billywig renderer
    if (IS_VIDEO && bid.renderer) {
      try {
        bid.renderer.render(bid);
        return;
      } catch (e) { /* fall through to iframe */ }
    }

    // Banner: write ad markup into iframe
    var iframe = document.createElement('iframe');
    iframe.frameBorder = '0';
    iframe.scrolling   = 'no';
    iframe.width       = bid.width  || AD_W;
    iframe.height      = bid.height || AD_H;
    iframe.style.cssText = 'border:none;display:block;';
    el.appendChild(iframe);

    var doc = iframe.contentWindow.document;
    doc.open();
    doc.write(bid.ad);
    doc.close();
  }

  // ── Step 3: configure pbjs and run auction ───────────────────────
  function runAuction() {
    window.pbjs.que.push(function () {

      // First Party Data — pagetype & category via FPD (required by Adagio RTD v9+)
      // Docs: AdagioRtdProvider warns when using params instead of FPD
      window.pbjs.setConfig({
        bidderTimeout: TIMEOUT,
        enableTIDs: true,
        deviceAccess: true,

        // FPD: pagetype and category at site level (deprecated from adUnit params)
        ortb2: {
          site: {
            ext: {
              data: {
                pagetype: PAGETYPE,
                category: 'general'
              }
            }
          }
        },

        // User sync — iframe required by Adagio
        userSync: {
          filterSettings: {
            iframe: {
              bidders: ['adagio'],
              filter: 'include'
            },
            image: {
              bidders: '*',
              filter: 'include'
            }
          }
        },

        // Adagio RTD provider config
        realTimeData: {
          dataProviders: [{
            name: 'adagio',
            params: {
              organizationId: ADAGIO_ORG_ID,
              site: ADAGIO_SITE,
              placementSource: 'ortb'  // reads placement from ortb2Imp.ext.data.placement
            }
          }]
        }
      });

      window.pbjs.bidderSettings = {
        '*': { storageAllowed: true }
      };

      // Ad unit — placement set via ortb2Imp.ext.data (not deprecated params)
      var adUnitDef = IS_VIDEO
        ? {
            code: slotId,
            ortb2Imp: {
              ext: {
                data: {
                  placement: PLACEMENT   // e.g. 'video_outstream'
                }
              }
            },
            mediaTypes: {
              video: {
                context: 'outstream',
                playerSize: [[AD_W, AD_H]],
                mimes: ['video/mp4', 'video/webm'],
                protocols: [1, 2, 3, 4, 5, 6],
                playbackmethod: [1, 2],
                maxduration: 30,
                api: [1, 2]
              }
            },
            bids: [{
              bidder: 'adagio',
              params: {
                organizationId: ADAGIO_ORG_ID,
                site: ADAGIO_SITE
              }
            }]
          }
        : {
            code: slotId,
            ortb2Imp: {
              ext: {
                data: {
                  placement: PLACEMENT   // e.g. 'banner_top'
                }
              }
            },
            mediaTypes: {
              banner: { sizes: SIZES }
            },
            bids: [{
              bidder: 'adagio',
              params: {
                organizationId: ADAGIO_ORG_ID,
                site: ADAGIO_SITE
              }
            }]
          };

      window.pbjs.addAdUnits([adUnitDef]);
      window.pbjs.requestBids({
        adUnits: [adUnitDef],
        bidsBackHandler: renderSlot
      });
    });
  }

  // ── Step 4: load Prebid.js then run auction ──────────────────────
  window.pbjs = window.pbjs || {};
  window.pbjs.que = window.pbjs.que || [];
  window.pbjs.distUrlBase = SERVER + '/';

  if (!window._ypLoaded) {
    window._ypLoaded = true;
    var s = document.createElement('script');
    s.src   = SERVER + '/api/pbjs';
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
