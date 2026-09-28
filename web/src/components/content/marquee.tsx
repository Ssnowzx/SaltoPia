interface MarqueeProps {
  readonly text: string;
  readonly cta: { readonly label: string; readonly href: string };
}

/** Copies of the text in one half of the track. Two halves make the loop seamless. */
const COPIES = 4;

/** A pinhão seed: the separator between repeats, in gold. */
function PinhaoGlyph(): React.ReactElement {
  return (
    <svg viewBox="0 0 20 28" className="mx-7 h-7 w-5 shrink-0 text-gold" aria-hidden="true" focusable="false">
      <path d="M10 1C15 1 18 8 18 15s-3.5 12-8 12S2 22 2 15 5 1 10 1Z" fill="currentColor" />
      <path d="M10 5c2.4 0 4 4 4 9" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" className="text-night" />
    </svg>
  );
}

/**
 * The festa's bunting along the band's top edge: a string of pennants in gold, cream and
 * the place's pale tint, tiled so it spans any width.
 */
function Bunting(): React.ReactElement {
  return (
    <svg className="absolute inset-x-0 top-0 h-5 w-full sm:h-6" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="bunting" width="96" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 1.5Q48 5 96 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-mist/50" />
          <path d="M4 2L20 2L12 20Z" className="fill-gold" />
          <path d="M36 3.5L52 3.5L44 22Z" className="fill-mist" />
          <path d="M68 2.5L84 2.5L76 20Z" className="fill-[var(--place-veil)]" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bunting)" />
    </svg>
  );
}

/**
 * The ribbon: the place's motto running sideways under bunting, with a call to action
 * that stands in its own box at the end rather than over the moving text.
 *
 * The track holds the text twice over, and the animation moves it exactly half its own
 * width before starting again - the second half is where the first was, so the loop has
 * no seam. Under reduced motion the stylesheet stops the animation and the text simply
 * stands, readable.
 */
export function Marquee({ text, cta }: MarqueeProps): React.ReactElement {
  const half = Array.from({ length: COPIES }, (_, index) => (
    <span key={index} className="flex items-center font-sans text-2xl font-extrabold tracking-[0.04em] whitespace-nowrap text-mist uppercase sm:text-[2rem]">
      {text}
      <PinhaoGlyph />
    </span>
  ));

  return (
    <div className="relative flex bg-[var(--place-deep)]" aria-label={text}>
      <Bunting />
      <div className="min-w-0 flex-1 overflow-hidden pt-9 pb-6 sm:pt-10 sm:pb-7">
        <div className="marquee-track flex w-max" aria-hidden="true">
          <div className="flex shrink-0">{half}</div>
          <div className="flex shrink-0">{half}</div>
        </div>
      </div>
      <div className="relative z-[1] flex shrink-0 items-center bg-mist px-4 sm:px-8">
        <a
          href={cta.href}
          className="rounded-button bg-[var(--place-accent)] px-4 py-3 font-sans text-xs font-bold tracking-[0.1em] text-mist uppercase shadow-[0_10px_24px_color-mix(in_srgb,var(--color-night)_22%,transparent)] transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-[var(--place-accent)]/30 focus-visible:outline-none sm:px-6 sm:py-3.5 sm:text-sm"
        >
          {cta.label}
        </a>
      </div>
    </div>
  );
}
