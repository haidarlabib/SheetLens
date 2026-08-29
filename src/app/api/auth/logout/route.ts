import { NextRequest, NextResponse } from "next/server";
import { clearSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getBaseUrl } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await clearSession();
  const response = NextResponse.redirect(`${getBaseUrl(request)}/`, { status: 303 });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function GET(request: NextRequest) {
  await clearSession();
  const response = NextResponse.redirect(`${getBaseUrl(request)}/`);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
