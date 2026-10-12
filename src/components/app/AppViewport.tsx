"use client";

import { CalendarDays, Dumbbell, Timer } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { NavContext, type NavApi, type ViewportSlot } from "@/src/components/app/nav";
import { SCREEN_LABELS, ScreenView } from "@/src/components/app/ScreenView";
import { ConfirmDialog, GlassButton, MenuOverlay, PhoneNav, TabBar, ViewportContext, type MenuItem, type TabBarItem } from "@/src/components/f1";
import { useActiveSession } from "@/src/hooks/use-active-session";
import { useAuth } from "@/src/hooks/use-auth";
import { useWeekSessions } from "@/src/hooks/use-week-sessions";
import { cn } from "@/src/lib/cn";
import { FITORA_URL } from "@/src/lib/env";
import { formatClock } from "@/src/lib/format";
import type { RecoveryParams, ScreenId } from "@/src/types/gym";

type TabId = "today" | "session" | "week";

/** Running clock under the "Đang tập" tab (own component so only it re-renders every second). */
function TabClock() {
  const { session, elapsedMs } = useActiveSession();
  return session ? <>{formatClock(elapsedMs)}</> : null;
}

const TABS: TabBarItem<TabId>[] = [
  { id: "today", label: "Hôm nay", icon: CalendarDays },
  { id: "session", label: "Đang tập", icon: Timer, badge: <TabClock /> },
  { id: "week", label: "Tuần này", icon: Dumbbell },
];

export interface AppViewportProps {
  slot: ViewportSlot;
  layout: "mobile" | "desktop";
  screen: ScreenId;
  recovery: RecoveryParams | null;
  onNavigate: (to: ScreenId, from: ViewportSlot) => void;
  onBack: (from: ViewportSlot) => void;
  onFinishRecovery: () => void;
  /** Changes when another viewport asks this one for attention → focus moves here. */
  attentionKey?: number;
}

/**
 * One app viewport: full screen on phones, or the content of one PhoneMockup on desktop. Owns the
 * nav bar, tab bar (phones only), red menu, logout confirmation and the overlay host for sheets.
 *
 * CSS variables for screens: --app-top (space under the nav) and --app-bottom (space above the tab bar
 * / phone edge). Screens pad with pt-[var(--app-top)] and pb-[calc(var(--app-bottom)+24px)].
 */
export function AppViewport({ slot, layout, screen, recovery, onNavigate, onBack, onFinishRecovery, attentionKey }: AppViewportProps) {
  const { user, signOut } = useAuth();
  const { pendingCount } = useWeekSessions();
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstScreen = useRef(true);

  const isAuth = slot === "auth";
  const showTabs = layout === "mobile" && !isAuth;

  // The scroll area is keyed by screen (fresh scroll position); move focus to it on navigation (not on first render).
  useEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false;
      return;
    }
    scrollRef.current?.focus({ preventScroll: true });
  }, [screen]);

  useEffect(() => {
    if (attentionKey) scrollRef.current?.focus({ preventScroll: true });
  }, [attentionKey]);

  const nav = useMemo<NavApi>(
    () => ({
      screen,
      navigate: (to) => onNavigate(to, slot),
      back: () => onBack(slot),
      layout,
      slot,
      recovery,
      finishRecovery: onFinishRecovery,
      openMenu: () => setMenuOpen(true),
    }),
    [screen, onNavigate, onBack, layout, slot, recovery, onFinishRecovery],
  );

  const viewport = useMemo(() => ({ host, kind: layout === "mobile" ? ("mobile" as const) : ("phone" as const) }), [host, layout]);

  const menuItems: MenuItem[] = [
    { id: "today", label: "Hôm nay", onSelect: () => nav.navigate("today"), current: screen === "today" },
    { id: "session", label: "Đang tập", onSelect: () => nav.navigate("session"), current: screen === "session" },
    { id: "week", label: "Tuần này", onSelect: () => nav.navigate("week"), current: screen === "week" },
    { id: "profile", label: "Hồ sơ", onSelect: () => nav.navigate("profile"), current: screen === "profile" },
    { id: "fitora", label: "Mở Fitora", href: FITORA_URL },
  ];

  const requestLogout = () => {
    if (pendingCount > 0) {
      setMenuOpen(false);
      setLogoutOpen(true);
    } else {
      setMenuOpen(false);
      void signOut();
    }
  };

  const style = {
    "--app-top": "calc(env(safe-area-inset-top) + 76px)",
    "--app-bottom": showTabs ? "calc(max(12px, env(safe-area-inset-bottom)) + 76px)" : "12px",
  } as CSSProperties;

  const Main = layout === "mobile" ? "main" : "div";
  const activeTab: TabId | null = screen === "today" || screen === "session" || screen === "week" ? screen : null;

  return (
    <NavContext.Provider value={nav}>
      <ViewportContext.Provider value={viewport}>
        <div className="relative h-full w-full overflow-hidden bg-bg text-fg" style={style}>
          <PhoneNav
            minimal={isAuth}
            scrolled={scrolled}
            menuOpen={menuOpen}
            profileActive={screen === "profile"}
            onProfile={() => nav.navigate("profile")}
            onMenu={() => setMenuOpen(true)}
          />
          <Main
            key={screen}
            ref={scrollRef}
            tabIndex={-1}
            aria-label={SCREEN_LABELS[screen]}
            role={layout === "mobile" ? undefined : "region"}
            onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}
            className={cn("absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain outline-none scrollbar-none")}
          >
            <ScreenView screen={screen} recovery={recovery} />
          </Main>
          {showTabs && <TabBar items={TABS} active={activeTab} onSelect={(id) => nav.navigate(id)} />}
          {/* Overlay host: Sheet / ConfirmDialog / MenuOverlay portal here (inside the phone on desktop). */}
          <div ref={setHost} className="pointer-events-none absolute inset-0 z-40" />
          {!isAuth && (
            <>
              <MenuOverlay
                open={menuOpen}
                onOpenChange={setMenuOpen}
                items={menuItems}
                caption={user?.email}
                footer={
                  <GlassButton variant="white" size="lg" block onClick={requestLogout}>
                    Đăng xuất
                  </GlassButton>
                }
              />
              <ConfirmDialog
                open={logoutOpen}
                onOpenChange={setLogoutOpen}
                title="Đăng xuất?"
                description={`Còn ${pendingCount} buổi tập chưa gửi lên Fitora. Hàng chờ gắn với tài khoản này và chỉ được gửi khi bạn đăng nhập lại.`}
                confirmLabel="Vẫn đăng xuất"
                cancelLabel="Ở lại"
                destructive
                onConfirm={signOut}
              />
            </>
          )}
        </div>
      </ViewportContext.Provider>
    </NavContext.Provider>
  );
}
