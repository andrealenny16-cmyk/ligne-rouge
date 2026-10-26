export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden>
        <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="16" r="5" stroke="#E8A36B" strokeWidth="2" />
        <path d="M16 6v3M16 23v3M7.5 11l2.5 1.5M22 19.5l2.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.35rem] leading-none tracking-wide">
        DÉCIBEL<span className="ml-1.5 hidden font-mono text-[0.6rem] tracking-[0.25em] text-white/50 sm:inline">PERFORMANCE</span>
      </span>
    </span>
  );
}
