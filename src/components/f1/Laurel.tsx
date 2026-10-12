import { cn } from "@/src/lib/cn";

/** Inline SVG laurel branch (coffee template asset replacement). `side="right"` mirrors it. Decorative. */
export function Laurel({ side = "left", className }: { side?: "left" | "right"; className?: string }) {
  const leaves = Array.from({ length: 7 }, (_, i) => i);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 96"
      className={cn("h-[73px] w-auto opacity-60", side === "right" && "-scale-x-100", className)}
      fill="none"
    >
      <path d="M30 92 C 12 76, 8 44, 22 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {leaves.map((i) => {
        const t = i / 6;
        const y = 86 - t * 76;
        const x = 28 - Math.sin(t * Math.PI * 0.95) * 16 - t * 2;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse cx="-6" cy="-2" rx="7" ry="3" transform="rotate(-35)" fill="currentColor" />
            <ellipse cx="6" cy="-3" rx="6.5" ry="2.8" transform="rotate(40)" fill="currentColor" />
          </g>
        );
      })}
    </svg>
  );
}
