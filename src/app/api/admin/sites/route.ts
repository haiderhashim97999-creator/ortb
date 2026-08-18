import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — all sites (pending + active + rejected)
export async function GET() {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sites = await prisma.site.findMany({
    include: {
      publisher: {
        include: { user: { select: { name: true, email: true } } },
      },
      adUnits: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, sites });
}

// PATCH — approve or reject a site
export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { siteId, action, adagioSite } = await req.json();

  if (!siteId) {
    return NextResponse.json({ error: "siteId required" }, { status: 400 });
  }

  // Update adagioSite slug only
  if (adagioSite !== undefined) {
    const site = await prisma.site.update({
      where: { id: siteId },
      data: { adagioSite },
    });
    return NextResponse.json({ success: true, site });
  }

  if (!action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  if (!["approve", "reject", "suspend"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    approve: "active",
    reject:  "rejected",
    suspend: "suspended",
  };

  const site = await prisma.site.update({
    where: { id: siteId },
    data: { status: statusMap[action] },
    include: {
      publisher: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ success: true, site });
}
