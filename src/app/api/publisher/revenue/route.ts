import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — publisher's monthly revenue records
export async function GET() {
  const session = await getSession();
  if (!session?.publisherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await prisma.paymentRecord.findMany({
    where: { publisherId: session.publisherId },
    orderBy: { monthKey: "desc" },
  });

  // Totals
  const totalEarned = records.reduce((s, r) => s + r.publisherAmount, 0);
  const totalPaid = records
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.publisherAmount, 0);
  const totalPending = records
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + r.publisherAmount, 0);

  return NextResponse.json({
    success: true,
    records,
    summary: { totalEarned, totalPaid, totalPending },
  });
}
