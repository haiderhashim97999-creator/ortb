import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, companyName, website } = await req.json();

    if (!email || !password || !name || !companyName || !website) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Clean domain from website
    let domain = website.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashed,
        name,
        role: "publisher",
        status: "pending",
        publisher: {
          create: {
            companyName,
            website: website.startsWith("http") ? website : `https://${website}`,
            revenueShare: 70,
            sites: {
              create: {
                name: companyName,
                domain,
                status: "active",
              },
            },
          },
        },
      },
      include: { publisher: true },
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful. Your account is pending admin approval.",
      userId: user.id,
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
