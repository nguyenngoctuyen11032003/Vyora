"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/src/components/app/toast";
import { ActiveSessionProvider } from "@/src/hooks/use-active-session";
import { AuthProvider } from "@/src/hooks/use-auth";
import { DataSourceProvider } from "@/src/hooks/use-data-source";
import { FitoraProfileProvider } from "@/src/hooks/use-fitora-profile";
import { WeekSessionsProvider } from "@/src/hooks/use-week-sessions";
import type { DataSource } from "@/src/lib/data";

/**
 * All app state, shared by every viewport (the three desktop phones show the SAME state).
 * Order matters: auth → profile (weight) → week sessions → active session.
 */
export function AppProviders({ data, children }: { data?: DataSource; children: ReactNode }) {
  return (
    <DataSourceProvider data={data}>
      <AuthProvider>
        <FitoraProfileProvider>
          <WeekSessionsProvider>
            <ActiveSessionProvider>
              <ToastProvider>{children}</ToastProvider>
            </ActiveSessionProvider>
          </WeekSessionsProvider>
        </FitoraProfileProvider>
      </AuthProvider>
    </DataSourceProvider>
  );
}
