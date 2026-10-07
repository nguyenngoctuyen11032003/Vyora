import Image from "next/image";
import { PageContainer } from "@/src/components/shared/page-container";
import { workoutPlan } from "@/src/data/workout-plan";

const sessionsPerWeek = workoutPlan.filter((day) => !day.isRestDay).length;

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-foreground"
        href="#main"
      >
        Bỏ qua tới nội dung
      </a>
      <PageContainer className="flex h-14 items-center gap-3 sm:h-16">
        <Image
          alt="Logo Gym Training Plan"
          className="size-8 shrink-0 rounded-[10px] object-cover ring-1 ring-border-strong sm:size-9"
          height={36}
          priority
          sizes="36px"
          src="/image/logo.png"
          width={36}
        />
        <div className="min-w-0 leading-none">
          <p className="truncate font-display text-[19px] font-semibold uppercase tracking-[0.04em] text-foreground sm:text-xl">
            Gym Training Plan
          </p>
          <p className="label-mono mt-1 truncate text-subtle-foreground">Giáo án 12 tuần</p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <span aria-hidden="true" className="hidden h-px w-10 bg-border-strong sm:block" />
          <span className="label-mono inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border-strong px-2 py-1 text-muted-foreground">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            {sessionsPerWeek} buổi<span className="hidden sm:inline"> / tuần</span>
          </span>
        </div>
      </PageContainer>
    </header>
  );
}
