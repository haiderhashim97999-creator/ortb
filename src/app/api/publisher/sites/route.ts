import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.publisherId) return NextResponse.json({ error: "Not a publisher" }, { status: 403 });

  const sites = await prisma.site.findMany({
    where: { publisherId: session.publisherId },
    include: { adUnits: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sites);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.publisherId) return NextResponse.json({ error: "Not a publisher" }, { status: 403 });

  const { name, domain } = await req.json();
  if (!name || !domain) {
    return NextResponse.json({ error: "name and domain required" }, { status: 400 });
  }

  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];

  try {
    const site = await prisma.site.create({
      data: {
        publisherId: session.publisherId,
        name,
        domain: cleanDomain,
        status: "pending",  // Admin approval required
      },
    });
    return NextResponse.json({ ...site, message: "Site submitted for approval" });
  } catch {
    return NextResponse.json({ error: "Domain already registered for this account" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.publisherId) return NextResponse.json({ error: "Not a publisher" }, { status: 403 });

  const { siteId } = await req.json();
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  // Verify ownership
  const site = await prisma.site.findFirst({
    where: { id: siteId, publisherId: session.publisherId },
  });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  await prisma.site.delete({ where: { id: siteId } });
  return NextResponse.json({ success: true });
}
