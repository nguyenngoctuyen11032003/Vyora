"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

/** Logical width of every phone screen; content is scaled by screenWidth / 390. */
export const PHONE_CONTENT_WIDTH = 390;

export interface PhoneMockupProps {
  /** Accessible name of the phone region ("Màn Hôm nay"). */
  label: string;
  children: ReactNode;
  className?: string;
  /** Larger single phone (login on desktop). */
  single?: boolean;
  /** Plays a short gold ring to draw the eye (changes → replays). */
  attentionKey?: number;
}

/**
 * iPhone-style frame of the F1 template. Children get a 390 px wide box whose height fills the screen
 * (screenH / scale), scaled to the frame: put a full-height, internally scrolling view inside.
 */
export function PhoneMockup({ label, children, className, single, attentionKey }: PhoneMockupProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = size && size.w > 0 ? size.w / PHONE_CONTENT_WIDTH : 1;
  const innerH = size && size.w > 0 ? size.h / scale : 844;

  return (
    <section aria-label={label} className="flex flex-col items-center">
      <div
        data-single={single ? "true" : undefined}
        className={cn(
          "phone-frame relative rounded-[clamp(30px,4vw,54px)] bg-black p-[clamp(6px,1vw,12px)] shadow-2xl shadow-black/60",
          className,
        )}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[clamp(30px,4vw,54px)] ring-1 ring-white/15" />
        {attentionKey ? (
          <span key={attentionKey} aria-hidden="true" className="phone-attention pointer-events-none absolute inset-0 z-[60] rounded-[clamp(30px,4vw,54px)]" />
        ) : null}
        {/* Side buttons */}
        <span aria-hidden="true" className="absolute -left-[3px] top-[19%] h-[4.5%] w-[3px] rounded-l bg-neutral-700" />
        <span aria-hidden="true" className="absolute -left-[3px] top-[26%] h-[7.3%] w-[3px] rounded-l bg-neutral-700" />
        <span aria-hidden="true" className="absolute -left-[3px] top-[35.5%] h-[7.3%] w-[3px] rounded-l bg-neutral-700" />
        <span aria-hidden="true" className="absolute -right-[3px] top-[30.8%] h-[11.4%] w-[3px] rounded-r bg-neutral-700" />

        <div ref={screenRef} className="relative h-full w-full overflow-hidden rounded-[clamp(24px,3.2vw,44px)] bg-bg">
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: PHONE_CONTENT_WIDTH,
              height: innerH,
              transform: `scale(${scale})`,
              visibility: size ? "visible" : "hidden",
            }}
          >
            {children}
          </div>
          {/* Dynamic Island */}
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[2.2%] z-50 h-[3.6%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    </section>
  );
}
