import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const publishers = await prisma.user.findMany({
    where: { role: "publisher" },
    include: {
      publisher: {
        include: {
          sites: { include: { adUnits: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(publishers);
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action, revenueShare, adminNotes } = await req.json();

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  const validActions = ["approve", "ban", "unban", "update"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  let status: string | undefined;
  if (action === "approve") status = "active";
  if (action === "ban") status = "banned";
  if (action === "unban") status = "active";

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: { publisher: true },
  });

  if (user.publisher && (revenueShare !== undefined || adminNotes !== undefined)) {
    // Preserve existing notes JSON (payment profile) — only update adminNotes key
    let existingNotes: Record<string, unknown> = {};
    try {
      existingNotes = JSON.parse(user.publisher.notes || "{}");
    } catch { /* not JSON yet */ }

    const newNotes = JSON.stringify({
      ...existingNotes,
      ...(adminNotes !== undefined && { adminNotes }),
    });

    await prisma.publisher.update({
      where: { id: user.publisher.id },
      data: {
        ...(revenueShare !== undefined && { revenueShare: Number(revenueShare) }),
        ...(adminNotes !== undefined && { notes: newNotes }),
      },
    });
  }

  return NextResponse.json({ success: true, user });
}
