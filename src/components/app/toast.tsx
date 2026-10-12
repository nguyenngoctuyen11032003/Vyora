"use client";

import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export type ToastTone = "success" | "info" | "warning";

export interface ToastApi {
  /** Shows a short message (4 s) in a polite live region. Icon + text, never colour alone. */
  show(message: string, options?: { tone?: ToastTone; durationMs?: number }): void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const ICON = { success: CheckCircle2, info: Info, warning: TriangleAlert } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const set = timers.current;
    return () => set.forEach((t) => window.clearTimeout(t));
  }, []);

  const show = useCallback<ToastApi["show"]>((message, options) => {
    const id = nextId.current++;
    setItems((prev) => [...prev.slice(-2), { id, message, tone: options?.tone ?? "success" }]);
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, options?.durationMs ?? 4000);
    timers.current.add(t);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+80px)] z-[70] flex flex-col items-center gap-2 px-4 md:top-auto md:bottom-6"
      >
        {items.map((t) => {
          const Icon = ICON[t.tone];
          return (
            <div
              key={t.id}
              className="glass-card animate-fade-slide-down pointer-events-auto flex bg-[#161b2e]/95 max-w-[400px] items-center gap-2.5 rounded-2xl px-4 py-3 text-[15px] text-fg shadow-[0_18px_40px_-16px_rgb(0_0_0/0.8)]"
            >
              <Icon
                aria-hidden="true"
                className={cn("size-5 shrink-0", t.tone === "success" ? "text-success" : t.tone === "warning" ? "text-gold" : "text-fg-muted")}
              />
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
