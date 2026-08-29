import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { HomeInstrument } from "@/components/home/HomeInstrument";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
      <HomeInstrument initialConnectedSheet={connectedSheet || null} />
    </AppShell>
  );
}
