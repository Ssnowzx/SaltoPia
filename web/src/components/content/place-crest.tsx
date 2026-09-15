import { crestSvg } from "@/lib/crest";

interface PlaceCrestProps {
  readonly slug: string;
  readonly name: string;
  readonly className?: string;
}

/**
 * A place's crest, inline. The markup comes from `crestSvg`, which also writes the
 * crest files - the string is built from the place's own slug and name, escaped there.
 */
export function PlaceCrest({ slug, name, className }: PlaceCrestProps): React.ReactElement {
  return <div className={className} dangerouslySetInnerHTML={{ __html: crestSvg(slug, name) }} />;
}
