# UI architecture (F1 redesign, UI phase)

Contract: `docs/superpowers/specs/2026-10-12-gym-f1-redesign-design.md` (§3 UI, §4 calories, §5 timer, §6 row, §7 structure).
This file describes what the foundation built and how screen engineers plug in. **Read it fully before editing a screen.**

UI phase = no Supabase. All data goes through `src/lib/data/` interfaces, backed by a localStorage **mock**.
The backend phase swaps the adapter in `src/lib/data/index.ts` and nothing in the UI changes.

---

## 1. Who owns what

| Owner | Files |
|---|---|
| Foundation | `app/**`, `next.config.ts`, `src/components/f1/**`, `src/components/app/**`, `src/lib/**`, `src/hooks/**`, `src/types/**`, `src/data/workout-plan.ts` (defaultVariant only), `.env.example`, `package.json` scripts |
| Screen engineer A: auth | `src/components/screens/LoginScreen.tsx`, `ForgotPasswordScreen.tsx`, `ResetPasswordScreen.tsx` (+ their `*.test.tsx`), `src/components/auth/**` |
| Screen engineer B: today | `src/components/screens/TodayScreen.tsx`, `ActivitySheet.tsx` (+ tests), restyle of `src/components/workout/**`, `src/components/shared/**`, `src/components/ui/**` and their existing tests (`workout-planner.tsx` + its test are now unused: delete or reuse) |
| Screen engineer C: session + week + profile | `src/components/screens/SessionScreen.tsx`, `FinishSheet.tsx`, `WeekScreen.tsx`, `ProfileScreen.tsx` (+ tests), `src/components/session/**`, `src/components/week/**`, `src/components/profile/**` |

Every screen file currently holds a **working placeholder** with its **final props**. Replace the body, keep the export name and props.
(`ScreenPlaceholder.tsx` has been deleted.)
Need something in a foundation file? Ask for it (do not edit it): the foundation keeps the API stable.

---

## 2. Layout model (how a screen is shown)

```
app/page.tsx → <AppShell/>   (src/components/app/AppShell.tsx)
  AppProviders (auth, profile/weight, week sessions, active session, toasts) — one shared state
  < 768px : one full-screen <AppViewport slot="main">  + glass TabBar (Hôm nay · Đang tập · Tuần này)
  ≥ 768px : F1 hero page (F1 background + bg-black/70) with THREE live PhoneMockups:
            slot "today" | "session" | "week", each an <AppViewport>, same state, no tab bar
  signed out / restoring / recovery link : <AppViewport slot="auth"> (desktop: one centred phone)
```

Each `AppViewport` renders: `PhoneNav` (logo · white profile square · glass menu square), the screen inside a scroll
area (`<main>` on phones, `role="region"` inside desktop phones, labelled with the screen name), the `TabBar` (phones),
the red `MenuOverlay` (Hôm nay, Đang tập, Tuần này, Hồ sơ, Mở Fitora, Đăng xuất + confirm when rows are pending) and an
**overlay host** where `Sheet`, `ConfirmDialog` and `MenuOverlay` portal (inside the phone on desktop).

### Rules for screens (important)

1. **Design for a 390 px wide box only (360–430 on real phones).** On desktop the screen is rendered at 390 px and
   scaled into the phone. **Never use viewport breakpoints** (`sm:`, `md:`, `lg:`) inside screens: inside a desktop
   phone they would apply desktop styles. Use `useNav().layout` if you really need to know.
2. The screen root is `relative flex min-h-full flex-col px-5`, padded with
   `pt-[var(--app-top)]` (space under the nav, 76 px + safe area) and `pb-[calc(var(--app-bottom)+24px)]`
   (`--app-bottom` = tab bar height on phones, 12 px in desktop phones). Sticky bottom actions:
   `sticky bottom-[calc(var(--app-bottom)+12px)]`.
3. Headings: the shell has the page `<h1>` (sr-only "Gym Training"). A screen's title is an **`<h2>`**.
4. Overlays: use `Sheet` / `ConfirmDialog` from `f1` (they portal into the right viewport, trap focus, close on
   Escape, return focus). Do not use `position: fixed` in screens. The existing exercise `ExerciseDetailDialog`
   (Radix Dialog / vaul Drawer) keeps its behaviour and opens over the page on desktop.
5. Screen state that should not appear in all three phones (an open sheet, a search query, the selected day)
   stays in the screen's own `useState`. Shared data (session, history, profile) comes from the hooks.
6. Images: plain `<img>` (static export). Local files: `asset("/image/…")` from `src/lib/env.ts` (adds the basePath).
7. Motion: entrance classes + `anim-delay-*`; everything is disabled under `prefers-reduced-motion`
   (globals.css), and `CountUp` jumps to the final value. Don't add JS animations that ignore it.
8. Accessibility: 44 px targets (`min-h-11`), visible focus (gold outline is global), status never by colour alone
   (icon/text too), Vietnamese copy, iframes titled.

---

## 3. Design tokens (`app/globals.css`)

Font: **Albert Sans** 300–800 via `next/font/google` (`--font-albert`, Tailwind `font-sans`; `font-display` is the same family).

| Token (CSS var) | Tailwind colour | Value | Use |
|---|---|---|---|
| `--bg` | `bg-bg` | `#0a0e1c` | page/screen background |
| `--bg-raised` | `bg-bg-raised` | `#121729` | rare raised surface |
| `--fg` / `--fg-muted` / `--fg-subtle` | `text-fg` / `text-fg-muted` (white 60 %) / `text-fg-subtle` (45 %) | | text, labels |
| `--gold` | `text-gold`, `bg-gold` | `#EDB40B` | running clock, kcal, primary button |
| `--gold-ink` | `text-gold-ink` | `#161000` | text on gold |
| `--gold-soft` | `bg-gold-soft` | gold 14 % | subtle highlight |
| `--f1-red` / `--f1-red-dark` | `bg-f1-red` … | `#E10600` / `#8B0000` | menu only |
| `--danger` | `text-danger` | `#ff7a70` | errors, destructive (AA on bg) |
| `--success` | `text-success` | `#6fdc8c` | "Đã lưu" icon |
| `--glass-card` / `--glass-border` | `bg-glass-card`, `border-glass-border` | rgba(20,20,30,.8) / white 10 % | |
| `--stat` | `bg-stat` | white 6 % | stat cards |
| `--line` / `--line-strong` | `border-line` / `border-line-strong` | white 10 % / 18 % | hairlines |
| `--radius-card` | `rounded-card` | 24 px | |

Legacy names used by `src/components/workout/*` still exist and are remapped to the new palette
(`bg-card`, `text-muted-foreground`, `border-border-strong`, `text-accent` = gold, …). Prefer the new names.

### Classes (components layer — utilities can override them)

| Class | What |
|---|---|
| `.glass-card` | F1 glass panel: rgba(20,20,30,.8) + 1 px white 10 % border + blur 16 |
| `.stat-card` | coffee stat card: white 6 %, radius 24 |
| `.glass` | coffee liquid-glass button surface (inset highlights, blur 2 + saturate 1.3, scale on :active) |
| `.glass-nav` | F1 square nav button glass (white 15 % + blur 12) |
| `.f1-menu-bg` | red menu gradient 160° `#1a0000 → #8B0000 → #E10600` |
| `.blur-mask` | 6 px backdrop blur masked `transparent → black 50%` (hero bottom) |
| `.text-fade` | template big-number gradient (white → transparent 85 %) |
| `.text-fade-soft` | readable white gradient (paused clock, big stats) |
| `.num-display` | display numerals: 600, tracking −0.06em, leading 0.78, tabular |
| `.tabular` | tabular numbers |
| `.scrollbar-none` | hide scrollbar |
| `.pb-safe` | padding-bottom ≥ safe area |
| `.phone-frame` | template phone sizing (`clamp(200px,75vw,340px)`, `min(25vw,42vh)` ≥768, `min(28vw,48vh,430px)` ≥1280, capped to the viewport height) |

### Animations (Tailwind `animate-*`, all `both` fill)

`animate-fade-slide-up` (0.9 s), `animate-fade-slide-down` (0.7 s), `animate-fade-slide-left`, `animate-fade-slide-right`,
`animate-scale-in` (1 s), `animate-fade-in` (0.8 s), `animate-speed-reveal` (0.8 s, name reveal), `animate-fade-rise`
(coffee 0.7 s), `animate-race-line`. Easing `cubic-bezier(0.16,1,0.3,1)`.

Delays: **`anim-delay-100` … `anim-delay-1600`** (any integer ms: `anim-delay-750`). Tailwind's own `delay-*` is
transition-delay and does nothing for these animations.

Typography (template): titles `font-normal leading-[0.95] tracking-[-0.05em] text-[48px]`; names
`font-semibold leading-[0.82] tracking-[-0.05em] text-[64px]`; big numbers `num-display text-[110px]` (110–120 px);
labels `text-fg-muted text-[13px]–[16px]`.

---

## 4. F1 components (`import { … } from "@/src/components/f1"`)

| Component | Props | Notes |
|---|---|---|
| `GlassButton` | `variant?: "glass" \| "primary" \| "white" \| "nav" \| "ghost" \| "danger"` (default glass), `size?: "sm" (44) \| "md" (48) \| "lg" (56) \| "icon" (44²) \| "circle" (58×44) \| "nav" (56² square)`, `block?`, `asChild?` (style an `<a>`), + button props | one `primary` (gold) per screen |
| `Chip` | `selected?`, `showCheck?` (default true), + button props | `aria-pressed`; selected = white + check icon. Day strip, categories, variants |
| `Sheet` | `open`, `onOpenChange`, `title`, `description?`, `height?: "tall" (90 %) \| "auto"`, `header?` (non-scrolling, e.g. search), `footer?` (sticky actions), `children` | bottom sheet, Radix Dialog: focus trap, Escape, focus return, close button "Đóng" |
| `ConfirmDialog` | `open`, `onOpenChange`, `title`, `description?`, `confirmLabel`, `cancelLabel?` ("Không"), `destructive?`, `onConfirm: () => void \| Promise<void>` | `role="alertdialog"`, busy state while `onConfirm` runs, closes when it resolves |
| `CountUp` | `value`, `durationMs?` (2200), `delayMs?`, `format?` (default `formatInt` → "1.850"), `className?` | cubic ease-out, counts from previous value; reduced motion → final value; SR reads final value |
| `StatCard` | `label`, `value` (node, e.g. `<CountUp/>`), `unit?`, `icon?`, `accent?` (gold), `className?` | coffee stat card |
| `TextField` | `label`, `error?`, `hint?`, `type?: "text" \| "email" \| "password" \| "number"`, + input props (ref forwarded) | glass input 56 px; password gets a 44 px show/hide toggle (`aria-pressed`); error has icon + `role="alert"` |
| `ScreenBackground` | `src?` (null → F1 template background), `overlayClassName?` ("bg-black/60"), `className?` | absolute full-bleed photo + overlay, z-0, decorative |
| `HeroPhoto` | `src` (YouTube thumbnail or null → F1 bg), `portrait?` (default true: crops the pillar-boxed 9:16 thumbnail), `className` (give it a height, ≤ ~690 px for portrait), `blurClassName?` ("h-1/2") | Screen-1 "driver photo": top-anchored, scale-in, 6 px blur mask on the lower half, fades into `--bg` |
| `ActivityIcon` | `activity?`, `category?`, `className?`, `strokeWidth?` | Fitora icon mapping; unknown key → category icon → generic. Also `iconFor(activity, category)`, `CATEGORY_ICON` |
| `Laurel` | `side?: "left" \| "right"`, `className?` | inline SVG laurel (profile identity) |
| `Skeleton` | `className?` | pulse block |
| `PhoneMockup` | `label`, `children`, `single?`, `attentionKey?`, `className?` | used by the shell only |
| `PhoneNav`, `TabBar`, `MenuOverlay` | see source | used by the shell only |
| `useViewport()` | → `{ host, kind: "mobile" \| "phone" }` | for custom overlays (portal into `host`) |

Toasts (shell): `const toast = useToast()` from `@/src/components/app/toast` → `toast.show("Đã lưu buổi tập", { tone?: "success" | "info" | "warning" })`.
Polite live region, icon + text.

---

## 5. Navigation (`useNav()` from `@/src/components/app/nav`)

No routes: one page, screens switch by state. `ScreenId = "login" | "forgot" | "reset" | "today" | "session" | "week" | "profile"`.

```ts
interface NavApi {
  screen: ScreenId;               // screen shown in THIS viewport
  navigate(to: ScreenId): void;   // see below
  back(): void;                   // profile → previous screen (desktop: phone's default); forgot/reset → login
  layout: "mobile" | "desktop";
  slot: "main" | "today" | "session" | "week" | "auth";
  recovery: RecoveryParams | null; // ?flow=recovery&token_hash=…&type=… or ?code=…
  finishRecovery(): void;          // after the new password is saved: clears the URL, enters the app
  openMenu(): void;
}
```

- **Phones**: `navigate("today" | "session" | "week")` swaps the screen (tab bar follows); `"profile"` stacks so `back()` returns.
- **Desktop**: `navigate("session")` from the Today phone does not change that phone: the Session phone plays a gold
  ring and receives focus. `"profile"` opens inside the phone where it was requested (back → its default).
- Auth: `navigate("forgot")`, `back()` → login. The shell shows the auth viewport while `useAuth().status !== "signedIn"`
  or a recovery link is open. After `signIn` succeeds the shell switches to the app by itself.
- Typical flows: Today "Bắt đầu buổi tập" → `useActiveSession().start({ kind: "plan", dayId, activity: "weight_training", variant: day.defaultVariant })`
  then `nav.navigate("session")` (2 taps from open). FinishSheet save → `nav.navigate("week")`.

`ScreenView` (`src/components/app/ScreenView.tsx`) is the only place screens are instantiated, with these props:

| Screen | Props |
|---|---|
| `LoginScreen` | none |
| `ForgotPasswordScreen` | none |
| `ResetPasswordScreen` | `{ recovery: RecoveryParams \| null }` |
| `TodayScreen` | `{ plan: WorkoutDay[] }` |
| `SessionScreen` | `{ plan: WorkoutDay[] }` |
| `WeekScreen`, `ProfileScreen` | none |
| `ActivitySheet` (used by Today/Session) | `{ open, onOpenChange, plannedDay: WorkoutDay \| null, onStart(input: StartSessionInput) }` |
| `FinishSheet` (used by Session) | `{ open, onOpenChange, onDone?(saved: GymWorkout \| null) }` |

---

## 6. Hooks (`src/hooks`, all need `<AppProviders>`)

| Hook | Returns |
|---|---|
| `useAuth()` | `status: "loading" \| "signedOut" \| "signedIn"`, `user`, `signIn(email, pw)`, `signOut()`, `requestPasswordReset(email)`, `verifyRecoveryLink(params)` (does not sign in), `updatePassword(pw)` (signs in on success). Every call returns `Result` = `{ ok: true, data } \| { ok: false, code, message }` with **ready-to-show Vietnamese `message`** |
| `useFitoraProfile()` | `profile: FitoraProfile \| null`, `status: "idle" \| "loading" \| "ready" \| "cached" \| "error"` (cached = offline, show "dữ liệu lúc " + `formatTimeOf(profile.fetchedAt)`), `error`, `reload()`, `weight`, `setManualWeight(kg)` |
| `useWeight()` | `{ weight: WeightInfo, setManualWeight }`. `WeightInfo = { kg, source: "measured" \| "profile" \| "manual" \| "fallback", label: "Fitora · đo 10/10" \| "Fitora · hồ sơ" \| "nhập tay" \| …, needsConfirm }` (fallback 65 kg must be confirmed before saving) |
| `useSessionStore()` | the same store without the clock (`session`, `start`, `pause`, …): use it when a component does not show the ticking time, so it does not re-render every second |
| `useActiveSession()` | `session: ActiveSession \| null`, `running`, `paused`, `elapsedMs` (ticks every second + on `visibilitychange`), `kcal` (live), `activity`, `variant`, `day`, `finishSummary` (`{ minutes, suggestedMinutes, forgotten (>4 h), canSave }`), `start(input)`, `pause()`, `resume()`, `toggleChecked(exerciseId)`, `setVariant(id)`, `complete({ durationMin, variant?, weightKg?, km? }) → Promise<GymWorkout>`, `discard()` |
| `useWeekSessions()` | `status`, `all` (8 weeks, newest first), `recent` (≤ 20), `week: { dates[7] (Mon→Sun), countByDate, sessions, minutes, kcal }`, `recentActivityKeys` (≤ 6, non-plan), `pendingCount`, `save(row)`, `remove(clientRef) → Result`, `reload()` |
| `useWakeLock(active)` | keeps the screen on while `active`; silently ignored when unsupported |
| `useCooldown(seconds)` | `{ remaining, active, start() }` ("Gửi lại sau 42 giây") |
| `useNow(enabled, ms?)` | ticking timestamp |
| `useMediaQuery(q)`, `usePrefersReducedMotion()` | |

---

## 7. Pure logic (`src/lib`)

| Module | Exports |
|---|---|
| `fitora/` (copied from Fitora `eded70e`, never edit) | `ACTIVITIES`, `findActivity`, `activitiesByCategory`, `defaultVariant`, `variantForMet`, `searchActivities(query, category?, list?, recentKeys?)`, `normalizeVi`, `buildTitle`, `isSpeedBased`, `joinDistanceNote`, `splitDistanceNote`, `formatKm`, `metKcal`, `resolveWeight`, `FALLBACK_WEIGHT_KG`, `WORKOUT_CATEGORIES`, `WORKOUT_CATEGORY_LABELS` (Gym · Cardio · Yoga · Chạy bộ · Bơi · Đạp xe · Thể thao đồng đội · Đi bộ · Khác), `GOAL_LABELS`, `ACTIVITY_LABELS`, `SEX_LABELS`, `MIN_PASSWORD` (8) |
| `calories.ts` | `planVariant(day)`, `variantOf(key, id)`, `sessionKcal(met, kg, min)`, `liveKcal(met, kg, ms)`, `kcalPerHour`, `metLine(met, kg)` → "≈ 7,0 MET · ~515 kcal/giờ với 70 kg", `kcalLabel(kcal)` → "≈ 257 kcal", `estimateCaption(kg, variantLabel)` → "ước lượng · 70 kg · Vừa", `KCAL_DISCLAIMER`, `PLAN_ACTIVITY_KEY` |
| `session.ts` | `start`, `pause`, `resume`, `elapsedMs`, `finish`, `toggleChecked`, `clampMinutes`, `parseSession`, `MIN/MAX_SAVE_MINUTES`, `FORGOTTEN_AFTER_MS` |
| `workout-row.ts` | `toWorkoutRow({ session, durationMin, variant?, weightKg?, km?, totalExercises? }) → FitWorkoutRow` |
| `format.ts` | `formatClock` (mm:ss / h:mm:ss), `formatInt` ("1.850"), `formatDecimal` ("7,0"), `formatKg`, `toLocalDate`, `toLocalTime`, `weekDates`, `weekStartIso`, `addDaysIso`, `formatDayMonth` ("10/10"), `weekdayShort`, `WEEKDAY_SHORT` (CN, T2…T7), `WEEKDAY_LONG`, `ageFrom`, `formatTimeOf` |
| `day-utils.ts` | `getCurrentWorkoutDay`, `findNextWorkoutDay`, `getDayHeroImage(day)` (first exercise thumbnail or null) |
| `video-utils.ts` | `isValidYouTubeEmbedUrl`, `getYouTubeWatchUrl`, `getYouTubeId`, `getYouTubeThumbnailUrl` |
| `weight.ts`, `recovery.ts`, `storage.ts`, `env.ts` (`FITORA_URL`, `asset()`, `F1_BACKGROUND_URL`), `outbox.ts` (typed, for the backend phase) | |

**Calories:** the code uses Fitora's real `metKcal` = MET · 3.5 · kg / 200 · min, so 70 kg · 60 min = **257 (Vừa) / 441 (Nặng)**,
not the 245 / 420 written in the spec example (that arithmetic assumed MET × kg × h). Matching Fitora is the spec's
requirement; the owner should confirm and fix the spec text.

---

## 8. Data layer (`src/lib/data`)

```ts
interface DataSource { kind: "mock" | "supabase"; auth: AuthAdapter; profile: ProfileAdapter; workouts: WorkoutsAdapter }
AuthAdapter    getUser · signIn · signOut · requestPasswordReset · verifyRecoveryLink · updatePassword
ProfileAdapter load(user) → Result<FitoraProfile>
WorkoutsAdapter list(user, since) · save(user, row) (idempotent on client_ref, never throws) · remove(user, clientRef) · pendingCount(user)
```

Types live in `src/types/gym.ts` (`AuthUser`, `Result`, `RecoveryParams`, `FitoraProfile`, `WeightInfo`, `ActiveSession`,
`StartSessionInput`, `FitWorkoutRow`, `GymWorkout` = row + `id`, `created_at`, `sync: "saved" | "pending" | "failed"`, `error?`).
Messages: `ERROR_MESSAGES`, `RESET_SENT_MESSAGE` ("Nếu email tồn tại, liên kết đặt lại đã được gửi").

### Mock behaviour (for review)

| Input | Result |
|---|---|
| any valid email + password ≥ 8 | signed in (persisted in `gym.mock.user`) |
| email contains `sai` | "Email hoặc mật khẩu không đúng" |
| email contains `offline` | "Không có kết nối mạng" (sign-in, reset, profile → cached) |
| email contains `moi` | signed in **without** a Fitora profile and without history (no-profile card, 65 kg fallback) |
| reset request | always "Nếu email tồn tại…"; UI applies the 60 s cooldown |
| `/?flow=recovery&token_hash=demo&type=recovery` | reset screen, link valid; any other token → "Liên kết đã hết hạn" |
| profile | display name from the email ("minh.anh@…" → "Minh Anh"), initials SVG avatar, 172 cm, 70 kg measured 2 days ago, Nam, 31 tuổi, Vận động vừa, Giảm cân · 1.850 kcal/ngày, target 66 kg, start 74 kg |
| history | first load seeds up to 2 sessions earlier this week (one "Chờ gửi") + 1 last week; saves are instant (`sync: "saved"`) in `gym.mock.workouts:<id>` |

Local storage keys: `gym.activeSession`, `gym.weightKg`, `gym.fitoraProfile:<user_id>`, `gym.mock.*`.

---

## 9. Testing

- `npm test` (Vitest + jsdom). Screens: `renderScreen(<WeekScreen />, { user?, nav? })` from
  `@/src/components/app/testing` wraps all providers (mock, 0 ms latency) and returns `nav` (vi.fn spies).
  Data loads asynchronously: use `findBy…`.
- Whole app: `render(<AppShell data={createMockDataSource({ latencyMs: 0 })} />)` (see `AppShell.test.tsx`).
- Spec §9 component tests belong to the screen owners (FinishSheet kcal/km, LoginScreen no sign-up, ActivitySheet "cau long", ProfileScreen with/without profile).

## 10. Running

- Dev: `npx next dev --port 3100` (Next allows one dev server per folder; if one already runs, use its port).
- Static export check: `npx next build` → `out/`; `NEXT_PUBLIC_BASE_PATH=/Vyora npx next build` for Pages.
- Screenshots: Playwright at 360×760, 390×844, 430×932, 1280×800, 1440×900.
