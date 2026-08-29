import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";
import { getBaseUrl } from "@/lib/auth/google";

export async function POST() {
  await clearSession();
  return NextResponse.redirect(`${getBaseUrl()}/`, { status: 303 });
}

export async function GET() {
  await clearSession();
  return NextResponse.redirect(`${getBaseUrl()}/`);
}
