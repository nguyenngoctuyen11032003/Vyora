"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { EmptyVideoState } from "@/src/components/shared/empty-video-state";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/cn";
import { getYouTubeWatchUrl, isValidYouTubeEmbedUrl } from "@/src/lib/video-utils";
import type { ExerciseVideo as ExerciseVideoType } from "@/src/types/workout";

export function ExerciseVideo({ video }: { video: ExerciseVideoType }) {
  const [loaded, setLoaded] = useState(false);

  if (!video.embedUrl || !isValidYouTubeEmbedUrl(video.embedUrl)) {
    return <EmptyVideoState />;
  }

  const portrait = video.aspectRatio === "9:16";
  const watchUrl = getYouTubeWatchUrl(video.embedUrl, portrait);

  return (
    <div className="mx-auto" style={portrait ? { width: "min(100%, calc(58dvh * 9 / 16))" } : undefined}>
      <div
        className={cn(
          "relative overflow-hidden rounded-[20px] border border-line-strong bg-black shadow-[0_24px_60px_-30px_rgb(0_0_0/0.9)]",
          portrait ? "aspect-[9/16]" : "aspect-video w-full",
        )}
      >
        {!loaded && <Skeleton className="absolute inset-0 size-full rounded-none bg-white/[0.06]" />}
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          referrerPolicy="strict-origin-when-cross-origin"
          src={video.embedUrl}
          title={video.title ?? "Video hướng dẫn bài tập"}
        />
      </div>
      {watchUrl && (
        <a
          className="glass mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium text-fg"
          href={watchUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Mở trên YouTube
          <ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        </a>
      )}
    </div>
  );
}
