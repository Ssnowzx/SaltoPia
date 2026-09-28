/** A four-pointed star in gold, flanking the contest's section titles and its prize lines. */
export function Sparkle({ className = "size-7 sm:size-10" }: { readonly className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 text-gold ${className}`} aria-hidden="true" focusable="false">
      <path d="M12 0C13 7 17 11 24 12 17 13 13 17 12 24 11 17 7 13 0 12 7 11 11 7 12 0Z" fill="currentColor" />
    </svg>
  );
}
