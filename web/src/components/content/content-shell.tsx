import { SiteHeader } from "@/components/site-header";
import type { Place } from "@/types";

import { LenisProvider } from "./lenis-provider";
import { SiteFooter } from "./site-footer";

interface ContentShellProps {
  readonly places: readonly Place[];
  readonly children: React.ReactNode;
}

/**
 * What every content page shares: the persistent navigation, smooth scrolling, and
 * the footer. The hub does not use this - it has no scroll and no footer.
 */
export function ContentShell({ places, children }: ContentShellProps): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col bg-straw">
      <SiteHeader places={places} />
      <main className="flex-1">{children}</main>
      <SiteFooter places={places} />
      <LenisProvider />
    </div>
  );
}
