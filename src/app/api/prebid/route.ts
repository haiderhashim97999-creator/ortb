/**
 * /api/prebid — kept for backwards compatibility, redirects to proxy.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/api/pbjs", "https://placeholder.local"), {
    status: 301,
  });
}
