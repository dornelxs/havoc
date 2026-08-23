import { cn } from "@/lib/utils";

/** Octógono + "H" — marca principal da Havoc (favicon/avatar). */
export function HavocMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <polygon
        points="60,10 140,10 190,60 190,140 140,190 60,190 10,140 10,60"
        className="fill-primary"
      />
      <text
        x="100"
        y="132"
        textAnchor="middle"
        fontSize="72"
        fontWeight="700"
        fontFamily="var(--font-display)"
        className="fill-background"
      >
        H
      </text>
    </svg>
  );
}
