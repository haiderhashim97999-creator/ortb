import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Store payment profile in publisher notes field (JSON)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await prisma.publisher.update({
    where: { id: session.publisherId },
    data: {
      notes: JSON.stringify({ paymentProfile: body, updatedAt: new Date().toISOString() }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getSession();
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const publisher = await prisma.publisher.findUnique({
    where: { id: session.publisherId },
    select: { notes: true },
  });

  try {
    const parsed = publisher?.notes ? JSON.parse(publisher.notes) : {};
    return NextResponse.json(parsed.paymentProfile || {});
  } catch {
    return NextResponse.json({});
  }
}
