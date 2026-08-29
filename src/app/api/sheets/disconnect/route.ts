import { NextResponse } from "next/server";
import { getSession, updateConnectedSheet } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await updateConnectedSheet(null);
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await updateConnectedSheet(null);
  return NextResponse.json({ success: true });
}
