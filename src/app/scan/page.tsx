import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { ScanInstrument } from "@/components/capture/ScanInstrument";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  const { user, connectedSheet } = session;

  return (
    <AppShell
      user={user}
      activeSpreadsheetTitle={connectedSheet?.spreadsheetTitle}
    >
      <ScanInstrument connectedSheet={connectedSheet || null} />
    </AppShell>
  );
}
