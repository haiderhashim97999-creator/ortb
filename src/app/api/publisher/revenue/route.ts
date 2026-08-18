import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// GET — publisher's monthly revenue records
export async function GET() {
  const session = await getSession();
  if (!session?.publisherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await db.paymentRecord.findMany({
    where: { publisherId: session.publisherId },
    orderBy: { monthKey: "desc" },
  });

  const totalEarned = records.reduce((s: number, r: { publisherAmount: number }) => s + r.publisherAmount, 0);
  const totalPaid = records
    .filter((r: { status: string }) => r.status === "paid")
    .reduce((s: number, r: { publisherAmount: number }) => s + r.publisherAmount, 0);
  const totalPending = records
    .filter((r: { status: string }) => r.status === "pending")
    .reduce((s: number, r: { publisherAmount: number }) => s + r.publisherAmount, 0);

  return NextResponse.json({
    success: true,
    records,
    summary: { totalEarned, totalPaid, totalPending },
  });
}
