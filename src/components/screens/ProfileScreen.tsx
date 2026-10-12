"use client";

// Spec §3.3 "Hồ sơ" (coffee identity + stat grid, F1 colours), read-only: avatar + laurels, name, goal line,
// Chiều cao / Cân nặng / Tuổi, Giới tính / Mức vận động / Cân nặng mục tiêu, pill "Sửa hồ sơ trong
// Fitora", the "Hoàn tất hồ sơ trong Fitora" card without fit_profiles, cached "dữ liệu lúc …" offline.
import { Cake, ChevronLeft, ClipboardList, ExternalLink, RotateCw, Ruler, Scale, WifiOff } from "lucide-react";
import { useId, type ReactNode } from "react";
import { useNav } from "@/src/components/app/nav";
import { CountUp, GlassButton, ScreenBackground, Skeleton, StatCard } from "@/src/components/f1";
import { ProfileIdentity } from "@/src/components/profile/ProfileIdentity";
import { useFitoraProfile } from "@/src/hooks/use-fitora-profile";
import { cn } from "@/src/lib/cn";
import { FITORA_URL } from "@/src/lib/env";
import { ACTIVITY_LABELS, GOAL_LABELS, SEX_LABELS } from "@/src/lib/fitora";
import { formatInt, formatKg, formatTimeOf } from "@/src/lib/format";
import type { FitoraProfile } from "@/src/types/gym";

function goalLine(p: FitoraProfile): string {
  const goal = p.goal ? GOAL_LABELS[p.goal] : null;
  const target = p.calorieTarget ? `${formatInt(p.calorieTarget)} kcal/ngày` : null;
  return [goal, target].filter(Boolean).join(" · ") || p.email;
}

function FitoraLink({ children, variant = "glass" }: { children: ReactNode; variant?: "glass" | "primary" }) {
  return (
    <GlassButton asChild variant={variant} size="lg" className={variant === "glass" ? "h-[54px] min-h-[54px] px-7" : undefined}>
      <a href={FITORA_URL} target="_blank" rel="noreferrer">
        {children}
        <ExternalLink aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
        <span className="sr-only">(mở tab mới)</span>
      </a>
    </GlassButton>
  );
}

export function ProfileScreen() {
  const nav = useNav();
  const { profile, status, error, reload, weight } = useFitoraProfile();
  const incompleteId = useId();

  const loading = !profile && (status === "idle" || status === "loading");

  return (
    <div className="relative flex min-h-full flex-col px-5 pb-[calc(var(--app-bottom)+24px)] pt-[var(--app-top)]">
      <ScreenBackground
        className="bottom-auto h-[420px] [mask-image:linear-gradient(to_bottom,black_35%,transparent)]"
        overlayClassName="bg-gradient-to-b from-black/60 via-bg/80 to-bg"
      />

      <div className="animate-fade-slide-down anim-delay-200 relative z-10 mt-2 flex items-center justify-between">
        <GlassButton size="circle" aria-label="Quay lại" onClick={nav.back}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </GlassButton>
        <p className="text-[14px] text-fg-muted">Hồ sơ Fitora · chỉ xem</p>
      </div>

      {loading ? (
        <div className="relative z-10 mt-8 flex flex-col items-center gap-4" aria-busy="true" aria-label="Đang tải hồ sơ">
          <Skeleton className="size-[108px] rounded-full" />
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-md" />
          <div className="mt-6 grid w-full grid-cols-3 gap-3">
            <Skeleton className="h-[104px] rounded-card" />
            <Skeleton className="h-[104px] rounded-card" />
            <Skeleton className="h-[104px] rounded-card" />
          </div>
        </div>
      ) : !profile ? (
        <div className="relative z-10 mt-10 stat-card p-5" role="alert">
          <p className="flex items-center gap-2 text-[17px] font-medium">
            <WifiOff aria-hidden="true" className="size-5 text-fg-muted" strokeWidth={1.8} />
            Chưa tải được hồ sơ
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-fg-muted">{error ?? "Vui lòng thử lại."}</p>
          <GlassButton size="lg" block className="mt-4" onClick={() => void reload()}>
            <RotateCw aria-hidden="true" className="size-5" strokeWidth={1.8} />
            Thử lại
          </GlassButton>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <ProfileIdentity
              name={profile.displayName || profile.email}
              avatarUrl={profile.avatarUrl}
              subtitle={profile.hasFitProfile ? goalLine(profile) : profile.email}
            />
          </div>

          {profile.hasFitProfile ? (
          <div className="animate-fade-rise anim-delay-700 relative z-10 mt-7 flex justify-center">
            <FitoraLink>Sửa hồ sơ trong Fitora</FitoraLink>
          </div>
          ) : null}

          {status === "cached" ? (
            <div className="relative z-10 mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/[0.06] py-1.5 pl-4 pr-1.5">
              <p className="flex items-center gap-2 text-[14px] text-fg-muted">
                <WifiOff aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
                Ngoại tuyến · dữ liệu lúc {formatTimeOf(profile.fetchedAt)}
              </p>
              <GlassButton size="sm" variant="ghost" onClick={() => void reload()}>
                Thử lại
              </GlassButton>
            </div>
          ) : null}

          {profile.hasFitProfile ? (
            <>
              <div className="relative z-10 mt-7 grid grid-cols-3 gap-3">
                <StatCard
                  className="animate-fade-rise anim-delay-750"
                  icon={<Ruler aria-hidden="true" className="size-5" strokeWidth={1.8} />}
                  label="Chiều cao"
                  unit="cm"
                  value={profile.heightCm ? <CountUp value={profile.heightCm} delayMs={750} durationMs={1400} /> : "—"}
                />
                <StatCard
                  className="animate-fade-rise anim-delay-800"
                  icon={<Scale aria-hidden="true" className="size-5" strokeWidth={1.8} />}
                  label="Cân nặng"
                  unit="kg"
                  value={<CountUp value={weight.kg} delayMs={800} durationMs={1400} format={formatKg} />}
                />
                <StatCard
                  className="animate-fade-rise anim-delay-850"
                  icon={<Cake aria-hidden="true" className="size-5" strokeWidth={1.8} />}
                  label="Tuổi"
                  value={profile.age !== null ? <CountUp value={profile.age} delayMs={850} durationMs={1400} /> : "—"}
                />
              </div>
              <p className="animate-fade-rise anim-delay-900 relative z-10 mt-2.5 px-1 text-[13px] text-fg-subtle">
                Cân nặng tính calo: {formatKg(weight.kg)} kg · {weight.label}
              </p>

              <dl className="animate-fade-rise anim-delay-950 stat-card relative z-10 mt-4 px-5 py-1">
                {[
                  ["Giới tính", profile.sex ? SEX_LABELS[profile.sex] : "—"],
                  ["Mức vận động", profile.activityLevel ? ACTIVITY_LABELS[profile.activityLevel] : "—"],
                  ["Cân nặng mục tiêu", profile.targetWeightKg ? `${formatKg(profile.targetWeightKg)} kg` : "—"],
                ].map(([k, v], i) => (
                  <div key={k} className={cn("flex min-h-14 items-center justify-between gap-4 py-3", i > 0 && "border-t border-line")}>
                    <dt className="text-[15px] text-fg-muted">{k}</dt>
                    <dd className="text-right text-[16px] font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <section className="animate-fade-rise anim-delay-800 stat-card relative z-10 mt-8 p-5" aria-labelledby={incompleteId}>
              <ClipboardList aria-hidden="true" className="size-6 text-gold" strokeWidth={1.8} />
              <h3 id={incompleteId} className="mt-3 text-[20px] font-medium leading-tight tracking-[-0.02em]">
                Hoàn tất hồ sơ trong Fitora để tính calo chính xác
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
                Fitora chưa có chiều cao, cân nặng và mục tiêu của bạn. Trong lúc chờ, app tính calo với {formatKg(weight.kg)} kg (
                {weight.label}), bạn có thể sửa số này khi kết thúc buổi tập.
              </p>
              <div className="mt-4 flex">
                <FitoraLink variant="primary">Mở Fitora</FitoraLink>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
