import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Base ads.txt entries for YieldProsper / OmniDex chain
const BASE_ADS_TXT = `# YieldProsper Ad Network - ads.txt
# Generated automatically. Do not edit manually.
# Supply Chain Entries

omni-dex.io, 100067, DIRECT
rubiconproject.com, 21274, DIRECT, 0bfd66d529a55807
pubmatic.com, 165321, DIRECT, 5d62403b186f2ace
onlinemediasolutions.com, 21159, DIRECT, b3868b187e4b6402
rubiconproject.com, 20416, RESELLER, 0bfd66d529a55807
onomagic.com, 211591, DIRECT
rubiconproject.com, 24364, RESELLER, 0bfd66d529a55807
getmediamx.com, 1221159, DIRECT
openx.com, 537153209, RESELLER, 6a698e2ec38604c6
Media.net, 8CUB46Z7R, RESELLER
pubmatic.com, 161332, RESELLER, 5d62403b186f2ace
video.unrulymedia.com, 6694405583287859332, RESELLER
lijit.com, 374814, RESELLER, fafdf38b16bf6b2b
loopme.com, 12733, RESELLER, 6c8d5f95897a5a3b
XANDR.COM, 11201, DIRECT
risecodes.com, 636cc1381c35e10001b200c7, DIRECT
rubiconproject.com, 23876, RESELLER, 0bfd66d529a55807
media.net, 8CUQ6928Q, RESELLER
sharethrough.com, 5926d422, RESELLER, d53b998a7bd4ecd2
sharethrough.com, 4284, RESELLER, d53b998a7bd4ecd2
smaato.com, 1100059219, RESELLER, 07bcf65f187117b4
33across.com, 001Pg000002MH4HIAW, RESELLER, bbea06d9c4d2853c
aceex.io, 898, RESELLER, b1cf3c874d5c6682
adipolo.com, 102032, RESELLER
admatic.de, ade-pub-7606008895, RESELLER, uufps1dh5stc6euk
video.unrulymedia.com, 460076256, DIRECT
smaato.com, 1100047589, RESELLER, 07bcf65f187117b4
appnexus.com, 6849, RESELLER
rubiconproject.com, 15268, RESELLER, 0bfd66d529a55807
xad.com, 963, RESELLER, 81cbf0a75a5e0e9a
pgamssp.com, 65c4dab8199399cda607f238, DIRECT
rubiconproject.com, 24852, RESELLER, 0bfd66d529a55807
pubmatic.com, 165708, RESELLER, 5d62403b186f2ace
video.unrulymedia.com, 5921144960123684292, RESELLER
pubmatic.com, 162623, RESELLER, 5d62403b186f2ace
richaudience.com, vVZVBBrq58, DIRECT
appnexus.com, 8233, RESELLER
pubmatic.com, 81564, RESELLER, 5d62403b186f2ace
pubmatic.com, 156538, RESELLER, 5d62403b186f2ace
rubiconproject.com, 13510, RESELLER`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;
  const cleanDomain = decodeURIComponent(domain);

  // Look up the site
  const site = await prisma.site.findFirst({
    where: { domain: cleanDomain, status: "active" },
    include: { publisher: { include: { user: true } } },
  });

  if (!site || site.publisher.user.status !== "active") {
    return new NextResponse("# Site not found or inactive\n", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const content = [
    BASE_ADS_TXT,
    site.adsTxtContent ? `\n# Publisher custom entries\n${site.adsTxtContent}` : "",
  ].join("\n");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
