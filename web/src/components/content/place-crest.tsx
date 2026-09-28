import { useId } from "react";

import { crestSvg } from "@/lib/crest";

interface PlaceCrestProps {
  readonly slug: string;
  readonly name: string;
  /** The place's colour. Without it the crest takes the site's night-blue. */
  readonly accent?: string;
  readonly className?: string;
}

/**
 * A place's crest, inline. The markup comes from `crestSvg`, which also writes the
 * crest files - the string is built from the place's own slug and name, escaped there.
 * Each instance gets its own ids, since one page draws the same crest several times.
 */
export function PlaceCrest({ slug, name, accent, className }: PlaceCrestProps): React.ReactElement {
  const idSuffix = useId();
  return <div className={className} dangerouslySetInnerHTML={{ __html: crestSvg(slug, name, { accent, idSuffix }) }} />;
}
