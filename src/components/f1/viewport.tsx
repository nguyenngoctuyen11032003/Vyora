"use client";

import { createContext, useContext } from "react";

export interface ViewportInfo {
  /** Element overlays (Sheet, MenuOverlay, ConfirmDialog) portal into. Null → document.body (tests). */
  host: HTMLElement | null;
  /** 'mobile' = full-screen app (<768px); 'phone' = inside a desktop PhoneMockup. */
  kind: "mobile" | "phone";
}

export const ViewportContext = createContext<ViewportInfo>({ host: null, kind: "mobile" });

/** Where overlays of the current screen must render (inside the phone on desktop). */
export function useViewport(): ViewportInfo {
  return useContext(ViewportContext);
}
