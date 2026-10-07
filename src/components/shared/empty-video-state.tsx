import { VideoOff } from "lucide-react";

export function EmptyVideoState() {
  return (
    <div className="relative flex min-h-48 flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-border-strong px-5 py-10 text-center sm:min-h-56">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(135deg,var(--border)_0_1px,transparent_1px_12px)]"
      />
      <span className="relative flex size-11 items-center justify-center rounded-xl border border-border-strong bg-card text-muted-foreground">
        <VideoOff aria-hidden="true" className="size-5" strokeWidth={1.5} />
      </span>
      <p className="relative mt-4 text-sm font-semibold text-foreground">Chưa có video hướng dẫn cho bài tập này.</p>
      <p className="relative mt-1 text-xs leading-5 text-muted-foreground">Video sẽ được cập nhật sau.</p>
    </div>
  );
}
