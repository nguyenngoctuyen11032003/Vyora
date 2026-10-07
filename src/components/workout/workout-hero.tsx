import { Hourglass, Timer } from "lucide-react";

const restGuides = [
  { label: "Nghỉ giữa set", value: "45–60", unit: "giây", icon: Timer },
  { label: "Nghỉ giữa bài", value: "3–5", unit: "phút", icon: Hourglass },
];

export function WorkoutHero() {
  return (
    <section className="grid gap-7 pb-2 pt-8 sm:pt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
      <div className="min-w-0">
        <p className="label-mono flex items-center gap-2.5 text-subtle-foreground">
          <span aria-hidden="true" className="h-px w-6 bg-accent" />
          Chương trình · Tuần 01–12
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.75rem,11vw,5rem)] font-semibold uppercase leading-[1.02] tracking-[-0.01em] text-foreground">
          Lịch tập
          <span className="block text-muted-foreground/70">
            trong tuần<span className="text-accent">.</span>
          </span>
        </h1>
        <p className="mt-5 max-w-[44ch] text-[15px] leading-6 text-muted-foreground">
          Chọn một ngày để xem bài tập, số set, số rep và video hướng dẫn.
        </p>
      </div>

      <dl className="crop-marks grid grid-cols-2 divide-x divide-border rounded-[20px] border border-border bg-card/70 backdrop-blur-sm md:w-[380px]">
        {restGuides.map(({ label, value, unit, icon: Icon }) => (
          <div key={label} className="min-w-0 px-4 py-4 sm:px-5">
            <dt className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon aria-hidden="true" className="size-3.5 shrink-0 text-accent" strokeWidth={1.5} />
              <span className="truncate">{label}</span>
            </dt>
            <dd className="mt-2 flex items-baseline gap-1.5">
              <span className="tabular font-display text-[32px] font-semibold leading-none text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground">{unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
