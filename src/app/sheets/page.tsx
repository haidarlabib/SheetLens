import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { SheetsManager } from "@/components/sheets/SheetsManager";

export const dynamic = "force-dynamic";

export default async function SheetsPage() {
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
      <SheetsManager initialConnectedSheet={connectedSheet || null} />
    </AppShell>
  );
}
