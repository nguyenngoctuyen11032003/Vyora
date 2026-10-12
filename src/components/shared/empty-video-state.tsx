import { VideoOff } from "lucide-react";

export function EmptyVideoState() {
  return (
    <div className="stat-card flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="glass flex size-11 items-center justify-center rounded-full text-fg-muted">
        <VideoOff aria-hidden="true" className="size-5" strokeWidth={1.6} />
      </span>
      <p className="mt-4 text-[15px] font-semibold text-fg">Chưa có video hướng dẫn cho bài tập này.</p>
      <p className="mt-1 text-[13px] leading-5 text-fg-muted">Video sẽ được cập nhật sau.</p>
    </div>
  );
}
