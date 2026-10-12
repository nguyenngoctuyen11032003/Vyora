"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AppProviders } from "@/src/components/app/AppProviders";
import { AppViewport } from "@/src/components/app/AppViewport";
import type { ViewportSlot } from "@/src/components/app/nav";
import { PhoneMockup, ScreenBackground } from "@/src/components/f1";
import { DESKTOP_QUERY, useMediaQuery } from "@/src/hooks/use-media-query";
import { useAuth } from "@/src/hooks/use-auth";
import { cn } from "@/src/lib/cn";
import type { DataSource } from "@/src/lib/data";
import { asset, LOGO_SRC } from "@/src/lib/env";
import { clearRecoveryParams, readRecoveryParams } from "@/src/lib/recovery";
import type { RecoveryParams, ScreenId } from "@/src/types/gym";

type AuthScreen = "login" | "forgot" | "reset";
type PhoneSlot = "today" | "session" | "week";

const PHONES: { slot: PhoneSlot; label: string; delay: string }[] = [
  { slot: "today", label: "Điện thoại 1: Hôm nay", delay: "anim-delay-300" },
  { slot: "session", label: "Điện thoại 2: Đang tập", delay: "anim-delay-500" },
  { slot: "week", label: "Điện thoại 3: Tuần này", delay: "anim-delay-700" },
];

const isAuthScreen = (s: ScreenId): s is AuthScreen => s === "login" || s === "forgot" || s === "reset";
const isPhoneSlot = (s: ScreenId): s is PhoneSlot => s === "today" || s === "session" || s === "week";

const subscribeNoop = () => () => {};
/** False during SSR/static HTML and hydration, true afterwards. */
function useHydrated() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

/** Root of the single page: providers + layout + state-based navigation (no routes). */
export function AppShell({ data }: { data?: DataSource }) {
  return (
    <AppProviders data={data}>
      <ShellLayout />
    </AppProviders>
  );
}

function ShellLayout() {
  const { status } = useAuth();
  const hydrated = useHydrated();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false);
  const layout = isDesktop ? "desktop" : "mobile";

  const [recovery, setRecovery] = useState<RecoveryParams | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [mobileStack, setMobileStack] = useState<ScreenId[]>(["today"]);
  /** Desktop: screen shown instead of a phone's default (only 'profile' today). */
  const [override, setOverride] = useState<Partial<Record<PhoneSlot, ScreenId>>>({});
  const [attention, setAttention] = useState<Partial<Record<PhoneSlot, number>>>({});

  // Recovery link (?flow=recovery&token_hash=…) opens the reset screen, signed in or not.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = readRecoveryParams(window.location.search);
      if (params) {
        setRecovery(params);
        setAuthScreen("reset");
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  // Fresh start of the app screens on every sign-in / sign-out.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (status === "signedOut") setAuthScreen((s) => (s === "reset" ? s : "login"));
      if (status === "signedIn") {
        setMobileStack(["today"]);
        setOverride({});
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [status]);

  const navigate = useCallback(
    (to: ScreenId, from: ViewportSlot) => {
      if (isAuthScreen(to)) {
        setAuthScreen(to);
        return;
      }
      if (layout === "mobile" || from === "main") {
        setMobileStack((stack) => {
          const top = stack[stack.length - 1];
          if (top === to) return stack;
          // Tabs replace the stack; profile stacks on top so "back" returns.
          return to === "profile" ? [...stack.filter((s) => s !== "profile"), "profile"] : [to];
        });
        return;
      }
      if (from === "auth") return;
      if (to === "profile") {
        setOverride((o) => ({ ...o, [from]: "profile" }));
        return;
      }
      if (isPhoneSlot(to)) {
        setOverride((o) => {
          const next = { ...o };
          delete next[to];
          return next;
        });
        if (to !== from) setAttention((a) => ({ ...a, [to]: (a[to] ?? 0) + 1 }));
      }
    },
    [layout],
  );

  const back = useCallback((from: ViewportSlot) => {
    if (from === "auth") {
      setAuthScreen("login");
      return;
    }
    if (from === "main") {
      setMobileStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : ["today"]));
      return;
    }
    setOverride((o) => {
      const next = { ...o };
      delete next[from as PhoneSlot];
      return next;
    });
  }, []);

  const finishRecovery = useCallback(() => {
    clearRecoveryParams();
    setRecovery(null);
    setAuthScreen("login");
    setMobileStack(["today"]);
  }, []);

  const showAuth = status !== "signedIn" || recovery !== null;
  const common = { layout, recovery, onNavigate: navigate, onBack: back, onFinishRecovery: finishRecovery } as const;

  if (!hydrated) {
    return <Splash />;
  }

  const authScreenShown: ScreenId = recovery ? (authScreen === "forgot" ? "forgot" : "reset") : authScreen;

  if (layout === "mobile") {
    return (
      <div className="relative h-dvh w-full overflow-hidden">
        <h1 className="sr-only">Vyora</h1>
        {showAuth ? (
          <AppViewport slot="auth" screen={authScreenShown} {...common} />
        ) : (
          <AppViewport slot="main" screen={mobileStack[mobileStack.length - 1]} {...common} />
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      <h1 className="sr-only">Vyora</h1>
      {/* Page background of the F1 template (a 480px YouTube thumbnail would be blurry at this size). */}
      <ScreenBackground overlayClassName="bg-black/70" className="fixed" />
      <main className="relative z-[2] flex h-dvh w-full items-center justify-center py-6">
        {showAuth ? (
          <div className="animate-fade-slide-up anim-delay-200">
            <PhoneMockup label="Đăng nhập" single>
              <AppViewport slot="auth" screen={authScreenShown} {...common} />
            </PhoneMockup>
          </div>
        ) : (
          <div className="flex items-end justify-center gap-[2vw]">
            {PHONES.map((p) => (
              <div key={p.slot} className={cn("animate-fade-slide-up", p.delay, p.slot === "session" && "-mb-6")}>
                <PhoneMockup label={p.label} attentionKey={attention[p.slot]}>
                  <AppViewport slot={p.slot} screen={override[p.slot] ?? p.slot} attentionKey={attention[p.slot]} {...common} />
                </PhoneMockup>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/** Static first paint (also what the exported HTML contains) before the layout is known. */
function Splash() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-bg" aria-busy="true">
      <h1 className="sr-only">Vyora</h1>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img src={asset(LOGO_SRC)} alt="" className="h-12 w-auto animate-pulse opacity-80" />
    </div>
  );
}
