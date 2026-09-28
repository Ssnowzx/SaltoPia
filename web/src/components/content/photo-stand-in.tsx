import { PlaceCrest } from "./place-crest";

interface PhotoStandInProps {
  /** The place, for its crest. Its colours come from the page's custom properties. */
  readonly placeSlug: string;
  readonly placeName: string;
  readonly accent: string;
  /** What the photograph will show - the item's name, set in script under the crest. */
  readonly label: string;
  readonly className?: string;
}

/**
 * What a card shows until its photograph exists: the place's colour, a field of pinhão
 * seeds, the crest and the item's name.
 *
 * It is drawn, not loaded, so a missing photograph costs no request and no 404. It fills
 * exactly the box the photograph will, so the card keeps its height when the picture
 * arrives.
 */
export function PhotoStandIn({ placeSlug, placeName, accent, label, className = "" }: PhotoStandInProps): React.ReactElement {
  return (
    <div
      role="img"
      aria-label={`${label} - foto em breve`}
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-[var(--place-veil)] px-4 text-center ${className}`}
    >
      <div aria-hidden="true" className="pinhao-pattern absolute inset-0" />
      <PlaceCrest slug={placeSlug} name={placeName} accent={accent} className="relative w-[42%] max-w-40 drop-shadow-[0_10px_18px_color-mix(in_srgb,var(--color-night)_25%,transparent)]" />
      <p className="relative mt-3 line-clamp-2 font-script text-2xl leading-tight text-[var(--place-ink)]">{label}</p>
      <p className="relative mt-2 font-sans text-[10px] font-bold tracking-[0.3em] text-[var(--place-accent)] uppercase">Foto em breve</p>
    </div>
  );
}
