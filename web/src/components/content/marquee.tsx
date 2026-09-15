interface MarqueeProps {
  readonly text: string;
  readonly cta: { readonly label: string; readonly href: string };
}

/** Copies of the text in one half of the track. Two halves make the loop seamless. */
const COPIES = 4;

/**
 * The band that scrolls its motto sideways under a call to action that stays put.
 *
 * The track holds the text twice over, and the animation moves it exactly half its own
 * width before starting again - the second half is where the first was, so the loop has
 * no seam. Under reduced motion the stylesheet stops the animation and the text simply
 * stands, readable.
 */
export function Marquee({ text, cta }: MarqueeProps): React.ReactElement {
  const half = Array.from({ length: COPIES }, (_, index) => (
    <span key={index} className="px-8 font-script text-3xl whitespace-nowrap text-mist/90 sm:text-5xl">
      {text}
      <span aria-hidden="true" className="px-8 text-gold">
        ✦
      </span>
    </span>
  ));

  return (
    <div className="relative overflow-hidden bg-[var(--place-deep)] py-7 sm:py-8" aria-label={text}>
      <div className="marquee-track flex w-max" aria-hidden="true">
        <div className="flex shrink-0">{half}</div>
        <div className="flex shrink-0">{half}</div>
      </div>
      {/* The call to action sits at the end of the strip behind a scrim, not over the
          middle of it: centred, the text ran straight through the button and neither was
          readable. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 pl-16 sm:pr-6">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-[130%] bg-[linear-gradient(to_right,transparent,var(--place-deep)_45%)]" />
        <a
          href={cta.href}
          className="pointer-events-auto relative rounded-button bg-gold px-5 py-3 font-sans text-xs font-bold tracking-[0.1em] text-araucaria uppercase shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-mist/50 focus-visible:outline-none sm:px-7 sm:py-3.5 sm:text-sm"
        >
          {cta.label}
        </a>
      </div>
    </div>
  );
}
