import { isValidYouTubeEmbedUrl } from "@/src/lib/video-utils";
import type { WorkoutDay } from "@/src/types/workout";

export function WorkoutDayHeader({ day }: { day: WorkoutDay }) {
  const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const videoCount = day.exercises.filter(
    (exercise) => exercise.video.embedUrl && isValidYouTubeEmbedUrl(exercise.video.embedUrl),
  ).length;
  const metrics = [
    { label: "Bài tập", value: day.exercises.length },
    { label: "Tổng set", value: totalSets },
    { label: "Có video", value: videoCount },
  ];

  return (
    <header key={day.id} className="reveal-in mt-10 sm:mt-14">
      <div aria-hidden="true" className="ruler opacity-80" />
      <div className="flex flex-col gap-5 border-t border-border pt-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="min-w-0">
          <p className="label-mono flex items-center gap-2 text-accent">
            <span aria-hidden="true" className="size-1.5 rotate-45 bg-accent" />
            {day.fullLabel} · {day.isRestDay ? "Phục hồi" : "Buổi tập"}
          </p>
          <h2 className="mt-3 font-display text-[clamp(2rem,8vw,3rem)] font-semibold uppercase leading-[1.05] tracking-[0.005em] text-foreground">
            {day.title}
          </h2>
          {day.description && <p className="mt-3 max-w-[60ch] text-sm leading-6 text-muted-foreground">{day.description}</p>}
        </div>

        {!day.isRestDay && (
          <dl className="grid shrink-0 grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card/70 md:w-[340px]">
            {metrics.map(({ label, value }) => (
              <div key={label} className="min-w-0 px-3.5 py-3 sm:px-4">
                <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
                <dd className="tabular mt-1 font-display text-[28px] font-semibold leading-none text-foreground">
                  {String(value).padStart(2, "0")}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}
