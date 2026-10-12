"use client";

import { useState } from "react";
import { Laurel } from "@/src/components/f1";

function initialsOf(name: string): string {
  const parts = name.trim().split(/[\s.@_-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

export interface ProfileIdentityProps {
  name: string;
  avatarUrl: string | null;
  subtitle: string;
}

/** Coffee identity block in F1 colours: avatar flanked by gold laurels, name, goal line. */
export function ProfileIdentity({ name, avatarUrl, subtitle }: ProfileIdentityProps) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className="relative">
        <span aria-hidden="true" className="animate-fade-in anim-delay-500 absolute flex right-[calc(100%+10px)] top-1/2 -translate-y-1/2">
          <Laurel side="left" className="h-[92px] text-gold" />
        </span>
        <span aria-hidden="true" className="animate-fade-in anim-delay-500 absolute flex left-[calc(100%+10px)] top-1/2 -translate-y-1/2">
          <Laurel side="right" className="h-[92px] text-gold" />
        </span>
        <div className="animate-scale-in anim-delay-300 size-[108px] overflow-hidden rounded-full bg-white/10 ring-1 ring-white/20 ring-offset-4 ring-offset-bg">
          {avatarUrl && !failed ? (
            // eslint-disable-next-line @next/next/no-img-element -- static export, data URI / signed URL
            <img src={avatarUrl} alt="" onError={() => setFailed(true)} className="size-full object-cover" />
          ) : (
            <span aria-hidden="true" className="flex size-full items-center justify-center bg-gradient-to-br from-f1-red-dark to-f1-red text-[38px] font-semibold tracking-[-0.04em]">
              {initialsOf(name)}
            </span>
          )}
        </div>
      </div>
      <h2 className="animate-fade-rise anim-delay-500 mt-6 max-w-full break-words text-[34px] font-semibold leading-[1] tracking-[-0.05em]">
        {name}
      </h2>
      <p className="animate-fade-rise anim-delay-600 mt-2 text-[15px] text-fg-muted">{subtitle}</p>
    </div>
  );
}
