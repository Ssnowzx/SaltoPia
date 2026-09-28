import Image from "next/image";

interface ContestPhotoProps {
  /** The photograph, or null until it has been generated. */
  readonly src: string | null;
  readonly label: string;
  readonly sizes: string;
  readonly className?: string;
}

/**
 * A photograph on the contest page, or - until it exists - a drawn stand-in: frost, a
 * field of pinhão seeds and what the picture will show. No request is made for a file that
 * is not there.
 */
export function ContestPhoto({ src, label, sizes, className = "" }: ContestPhotoProps): React.ReactElement {
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={src} alt={label} fill quality={88} sizes={sizes} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${label} - foto em breve`}
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-[color-mix(in_srgb,var(--color-frost)_45%,var(--color-mist))] px-4 text-center ${className}`}
    >
      <div aria-hidden="true" className="pinhao-pattern absolute inset-0 [--place-accent:var(--color-night)]" />
      <p className="relative font-script text-2xl leading-tight text-night">{label}</p>
      <p className="relative mt-2 font-sans text-[10px] font-bold tracking-[0.3em] text-wine uppercase">Foto em breve</p>
    </div>
  );
}
