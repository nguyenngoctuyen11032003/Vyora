"use client";

import { createContext, useContext } from "react";
import type { RecoveryParams, ScreenId } from "@/src/types/gym";

/**
 * Which viewport a screen lives in.
 * - 'main'  : the single full-screen app on phones (<768px)
 * - 'today' | 'session' | 'week' : the three live PhoneMockups on ≥768px
 * - 'auth'  : login / forgot / reset (full screen on phones, one centred phone on desktop)
 */
export type ViewportSlot = "main" | "today" | "session" | "week" | "auth";

export interface NavApi {
  /** Screen shown in THIS viewport. */
  screen: ScreenId;
  /**
   * Go to a screen. Phone layout: swaps the screen. Desktop: 'today' | 'session' | 'week' highlight
   * (gold ring + focus) the phone that shows it; 'profile' opens inside the current phone.
   * 'login' | 'forgot' | 'reset' switch the auth viewport.
   */
  navigate(to: ScreenId): void;
  /** Leaves 'profile' / 'forgot' (back to the previous screen / login). */
  back(): void;
  layout: "mobile" | "desktop";
  slot: ViewportSlot;
  /** Recovery link params when the app was opened from a reset email, else null. */
  recovery: RecoveryParams | null;
  /** Call after the new password is saved: clears the URL params and enters the app. */
  finishRecovery(): void;
  /** Opens the red menu of this viewport. */
  openMenu(): void;
}

export const NavContext = createContext<NavApi | null>(null);

export function useNav(): NavApi {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside the AppShell (or <TestNavProvider>)");
  return ctx;
}
