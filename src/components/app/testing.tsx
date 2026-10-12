"use client";

// Test helpers for screen components (Vitest + Testing Library). Not imported by the app.
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";
import { AppProviders } from "@/src/components/app/AppProviders";
import { NavContext, type NavApi } from "@/src/components/app/nav";
import { createMockDataSource, MOCK_USER_KEY } from "@/src/lib/data/mock";
import type { AuthUser, ScreenId } from "@/src/types/gym";

export const TEST_USER: AuthUser = { id: "mock-test", email: "minh.anh@example.com" };

/** A NavApi whose functions are vi.fn() spies. */
export function createTestNav(overrides: Partial<NavApi> = {}): NavApi {
  return {
    screen: "today",
    navigate: vi.fn(),
    back: vi.fn(),
    layout: "mobile",
    slot: "main",
    recovery: null,
    finishRecovery: vi.fn(),
    openMenu: vi.fn(),
    ...overrides,
  };
}

export function TestNavProvider({ nav, children }: { nav: NavApi; children: ReactNode }) {
  return <NavContext.Provider value={nav}>{children}</NavContext.Provider>;
}

export interface RenderScreenOptions {
  /** Signed-in user (default TEST_USER); null renders signed out. */
  user?: AuthUser | null;
  screen?: ScreenId;
  nav?: Partial<NavApi>;
}

/**
 * Renders a screen with every provider (mock data, 0 ms latency) and a spy NavApi.
 * Signed-in state is restored asynchronously: use `await screen.findBy…`.
 */
export function renderScreen(ui: ReactElement, options: RenderScreenOptions = {}): RenderResult & { nav: NavApi } {
  const user = options.user === undefined ? TEST_USER : options.user;
  if (user) localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(MOCK_USER_KEY);
  const nav = createTestNav({ screen: options.screen ?? "today", ...options.nav });
  const result = render(
    <AppProviders data={createMockDataSource({ latencyMs: 0 })}>
      <TestNavProvider nav={nav}>{ui}</TestNavProvider>
    </AppProviders>,
  );
  return { ...result, nav };
}
