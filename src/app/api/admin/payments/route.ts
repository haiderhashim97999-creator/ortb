import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — fetch all payment records (admin view)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await prisma.paymentRecord.findMany({
    orderBy: [{ monthKey: "desc" }, { publisherId: "asc" }],
  });

  // Attach publisher info
  const publisherIds = [...new Set(records.map((r) => r.publisherId))];
  const publishers = await prisma.publisher.findMany({
    where: { id: { in: publisherIds } },
    include: { user: { select: { name: true, email: true } } },
  });

  const pubMap = Object.fromEntries(publishers.map((p) => [p.id, p]));

  const enriched = records.map((r) => ({
    ...r,
    publisher: pubMap[r.publisherId]
      ? {
          companyName: pubMap[r.publisherId].companyName,
          name: pubMap[r.publisherId].user.name,
          email: pubMap[r.publisherId].user.email,
          notes: pubMap[r.publisherId].notes,
        }
      : null,
  }));

  return NextResponse.json({ success: true, records: enriched });
}

// POST — upsert monthly payment record (called when admin syncs revenue)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { publisherId, monthKey, grossRevenue, revenueShare, impressions } =
    await req.json();

  if (!publisherId || !monthKey) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const publisherAmount = (grossRevenue * revenueShare) / 100;

  const record = await prisma.paymentRecord.upsert({
    where: { publisherId_monthKey: { publisherId, monthKey } },
    update: { grossRevenue, revenueShare, publisherAmount, impressions, updatedAt: new Date() },
    create: { publisherId, monthKey, grossRevenue, revenueShare, publisherAmount, impressions },
  });

  return NextResponse.json({ success: true, record });
}

// PATCH — mark as paid
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recordId, paidNote } = await req.json();
  if (!recordId) return NextResponse.json({ error: "Missing recordId" }, { status: 400 });

  const record = await prisma.paymentRecord.update({
    where: { id: recordId },
    data: {
      status: "paid",
      paidAt: new Date(),
      paidNote: paidNote || "",
    },
  });

  return NextResponse.json({ success: true, record });
}
