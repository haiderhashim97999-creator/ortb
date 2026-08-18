import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { publisher: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.status === "banned") {
      return NextResponse.json({ error: "Your account has been suspended. Contact support." }, { status: 403 });
    }

    if (user.status === "pending" && user.role !== "admin") {
      return NextResponse.json({ error: "Your account is pending approval." }, { status: 403 });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "admin" | "publisher",
      publisherId: user.publisher?.id,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        publisherId: user.publisher?.id,
      },
    });

    // secure: only if HTTPS is actually in use (not plain IP/HTTP)
    const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://");

    res.cookies.set("yp_token", token, {
      httpOnly: true,
      secure: isHttps === true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
