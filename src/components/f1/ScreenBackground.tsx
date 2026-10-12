"use client";

import { useState } from "react";
import { cn } from "@/src/lib/cn";
import { F1_BACKGROUND_URL } from "@/src/lib/env";

export interface ScreenBackgroundProps {
  /** Image URL; null/undefined or a load error falls back to the F1 template background. */
  src?: string | null;
  /** Darkening layer (template: bg-black/60 in screens, bg-black/70 on the page). */
  overlayClassName?: string;
  className?: string;
}

/** Full-bleed photo + dark overlay behind a screen (absolute, z-0). Decorative. */
export function ScreenBackground({ src, overlayClassName = "bg-black/60", className }: ScreenBackgroundProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const url = src && failed !== src ? src : F1_BACKGROUND_URL;
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, remote image */}
      <img src={url} alt="" onError={() => setFailed(src ?? null)} className="absolute inset-0 h-full w-full object-cover" />
      <div className={cn("absolute inset-0", overlayClassName)} />
    </div>
  );
}

/** Sharpest YouTube thumbnail first (maxres 1280, sd 640), the given hqdefault (480) last. */
export function heroCandidates(src: string | null): string[] {
  if (!src) return [];
  const m = src.match(/^(https:\/\/i\.ytimg\.com\/vi\/[A-Za-z0-9_-]{11}\/)hqdefault\.jpg$/);
  return m ? [`${m[1]}maxresdefault.jpg`, `${m[1]}sddefault.jpg`, src] : [src];
}

export interface HeroPhotoProps {
  /** YouTube thumbnail (https://i.ytimg.com/vi/<id>/hqdefault.jpg) or null → F1 background. */
  src: string | null;
  /**
   * The thumbnail is a pillar-boxed 9:16 video (Shorts): zoom so only the video column shows, no black
   * bars. Every video of the plan is 9:16, so this is the default.
   */
  portrait?: boolean;
  className?: string;
  /** Height of the blurred bottom part (default 50 %). */
  blurClassName?: string;
}

/**
 * The "driver photo" of Screen 1: a large image anchored to the top with the 6 px blur mask on its
 * lower half (spec §3.1). Positioned absolute; give it a height through className.
 */
export function HeroPhoto({ src, portrait = true, className, blurClassName = "h-1/2" }: HeroPhotoProps) {
  const candidates = heroCandidates(src);
  // Position in `candidates` for the current src; a failed or placeholder image moves to the next size.
  const [attempt, setAttempt] = useState<{ src: string | null; index: number }>({ src, index: 0 });
  const index = attempt.src === src ? attempt.index : 0;
  const usable = candidates[index] ?? null;
  const next = () => setAttempt({ src, index: index + 1 });
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-0 overflow-hidden", className)}>
      {usable ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export, remote image
        <img
          src={usable}
          alt=""
          onError={next}
          // ytimg answers a missing size with a 120×90 grey placeholder instead of an error.
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth <= 120) next();
          }}
          className={cn(
            "animate-scale-in anim-delay-300 absolute left-1/2 top-0 max-w-none -translate-x-1/2 origin-top",
            portrait ? "w-[238%]" : "h-full w-full object-cover",
          )}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- static export, remote image
        <img src={F1_BACKGROUND_URL} alt="" className="animate-scale-in anim-delay-300 absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
      <div className={cn("blur-mask absolute inset-x-0 bottom-0", blurClassName)} />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}
