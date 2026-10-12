"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createDataSource, type DataSource } from "@/src/lib/data";

const DataSourceContext = createContext<DataSource | null>(null);

/** Provides the data source (mock in the UI phase). Tests pass `createMockDataSource({ latencyMs: 0 })`. */
export function DataSourceProvider({ data, children }: { data?: DataSource; children: ReactNode }) {
  const [source] = useState<DataSource>(() => data ?? createDataSource());
  return <DataSourceContext.Provider value={source}>{children}</DataSourceContext.Provider>;
}

export function useDataSource(): DataSource {
  const ctx = useContext(DataSourceContext);
  if (!ctx) throw new Error("useDataSource must be used inside <AppProviders>");
  return ctx;
}
