import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sources = await prisma.ortbDemandSource.findMany({
    orderBy: { priority: "asc" },
  });
  return NextResponse.json(sources);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, endpoint, apiKey, timeout, priority, mediaTypes, floorCpm } = await req.json();

  if (!name || !endpoint) {
    return NextResponse.json({ error: "name and endpoint required" }, { status: 400 });
  }

  const source = await prisma.ortbDemandSource.create({
    data: {
      name,
      endpoint,
      apiKey: apiKey || "",
      timeout: timeout || 300,
      priority: priority || 1,
      mediaTypes: mediaTypes || "banner,video",
      floorCpm: floorCpm || 0.0,
      active: true,
    },
  });

  return NextResponse.json(source);
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const source = await prisma.ortbDemandSource.update({
    where: { id },
    data,
  });
  return NextResponse.json(source);
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.ortbDemandSource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
