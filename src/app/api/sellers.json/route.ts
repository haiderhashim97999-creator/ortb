import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // cache 1 hour

export async function GET() {
  const publishers = await prisma.publisher.findMany({
    where: { user: { status: "active" } },
    include: { user: true },
  });

  const sellers = publishers.map((pub) => ({
    seller_id: pub.sellerId,
    seller_type: pub.sellerType,
    name: pub.isConfidential ? undefined : pub.companyName,
    domain: pub.isConfidential ? undefined : pub.website.replace(/^https?:\/\//, "").split("/")[0],
    is_confidential: pub.isConfidential ? 1 : 0,
  }));

  const sellersJson = {
    contact_email: "sellers@yieldprosper.com",
    contact_address: "YieldProsper Ad Network",
    version: "1.0",
    sellers,
  };

  return new NextResponse(JSON.stringify(sellersJson, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
