import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { DataAnalysisInstrument } from "@/components/analysis/DataAnalysisInstrument";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
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
      <DataAnalysisInstrument connectedSheet={connectedSheet || null} />
    </AppShell>
  );
}
