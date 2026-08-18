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

// PATCH — approve/reject/suspend a site OR save adagioSite slug
export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { siteId, action, adagioSite } = body;

  if (!siteId) {
    return NextResponse.json({ error: "siteId required" }, { status: 400 });
  }

  // Save adagioSite slug — use any cast until prisma generate runs on VPS
  if (adagioSite !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any;
    const site = await db.site.update({
      where: { id: siteId },
      data: { adagioSite: String(adagioSite) },
    });
    return NextResponse.json({ success: true, site });
  }

  // Status actions
  if (!action || !["approve", "reject", "suspend"].includes(action)) {
    return NextResponse.json({ error: "action required: approve|reject|suspend" }, { status: 400 });
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
