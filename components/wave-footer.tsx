const WAVES = [
  { cls: "w1", d: "M0 70Q400 20 800 70T1600 70T2400 70T3200 70T4000 70T4800 70T5600 70T6400 70V150H0Z" },
  { cls: "w2", d: "M0 92Q400 52 800 92T1600 92T2400 92T3200 92T4000 92T4800 92T5600 92T6400 92V150H0Z" },
  { cls: "w3", d: "M0 116Q400 88 800 116T1600 116T2400 116T3200 116T4000 116T4800 116T5600 116T6400 116V150H0Z" },
];

/**
 * Laptops: the waves stay in the background, behind the page and stuck to the bottom of the window. In front of
 * everything, a slim footer bar along the bottom carries the name; it takes no space (the page's bottom padding
 * clears it) and no clicks. Phones have the bottom tab bar instead.
 */
export function WaveFooter() {
  return (
    <>
      <div className="qa-waves max-md:hidden" aria-hidden>
        {WAVES.map((w) => (
          <svg key={w.cls} className={w.cls} viewBox="0 0 6400 150" preserveAspectRatio="none">
            <path d={w.d} />
          </svg>
        ))}
      </div>
      <footer className="pointer-events-none sticky bottom-0 z-2 -mt-11 flex h-11 items-center justify-between gap-4 border-t border-line/70 bg-card/70 px-8 text-[0.8125rem] text-body2 backdrop-blur-md max-md:hidden">
        <span className="truncate font-medium">Davao City Water District</span>
        <span className="truncate text-muted-foreground">QA Hub for the in-house ERP</span>
      </footer>
    </>
  );
}
