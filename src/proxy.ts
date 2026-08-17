import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "yieldprosper-jwt-secret-change-in-production-32chars"
);

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/sellers.json",
  "/api/ads-txt",
  "/api/tag",
  "/api/pbjs",
  "/api/prebid",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/js/") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("yp_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Admin-only paths — redirect publishers away
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Publisher dashboard — redirect admins to admin panel
    if (pathname.startsWith("/dashboard") && role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token — clear it and redirect to login
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("yp_token", "", { maxAge: 0, path: "/" });
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
