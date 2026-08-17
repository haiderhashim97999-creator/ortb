import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.publisherId) return NextResponse.json({ error: "Not a publisher" }, { status: 403 });

  const siteId = req.nextUrl.searchParams.get("siteId");

  const adUnits = await prisma.adUnit.findMany({
    where: {
      site: { publisherId: session.publisherId },
      ...(siteId ? { siteId } : {}),
    },
    include: { site: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(adUnits);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.publisherId) return NextResponse.json({ error: "Not a publisher" }, { status: 403 });

  const { siteId, name, adType, sizes, bidFloor } = await req.json();

  if (!siteId || !name || !adType) {
    return NextResponse.json({ error: "siteId, name, and adType required" }, { status: 400 });
  }

  // Verify site ownership
  const site = await prisma.site.findFirst({
    where: { id: siteId, publisherId: session.publisherId },
  });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const defaultSizes =
    adType === "video"
      ? "[[640,480],[1280,720]]"
      : "[[300,250],[728,90],[320,50]]";

  const adUnit = await prisma.adUnit.create({
    data: {
      siteId,
      name,
      adType,
      sizes: sizes ? JSON.stringify(sizes) : defaultSizes,
      bidFloor: bidFloor || 0.0,
      status: "active",
    },
  });

  return NextResponse.json(adUnit);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.publisherId) return NextResponse.json({ error: "Not a publisher" }, { status: 403 });

  const { adUnitId } = await req.json();
  if (!adUnitId) return NextResponse.json({ error: "adUnitId required" }, { status: 400 });

  const adUnit = await prisma.adUnit.findFirst({
    where: { id: adUnitId, site: { publisherId: session.publisherId } },
  });
  if (!adUnit) return NextResponse.json({ error: "Ad unit not found" }, { status: 404 });

  await prisma.adUnit.delete({ where: { id: adUnitId } });
  return NextResponse.json({ success: true });
}
