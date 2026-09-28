import { InvitationCard } from "@/components/contest/invitation-card";
import { SiteHeader } from "@/components/site-header";
import type { Place } from "@/types";

import { LenisProvider } from "./lenis-provider";
import { SiteFooter } from "./site-footer";

interface ContentShellProps {
  readonly places: readonly Place[];
  readonly children: React.ReactNode;
  /** False on the contest page, which is where the invitation would send the visitor. */
  readonly inviteToContest?: boolean;
}

/** Long enough for the page to be seen before the contest's card arrives over it. */
const INVITATION_DELAY_MS = 1500;

/**
 * What every content page shares: the persistent navigation, smooth scrolling, and
 * the footer. The hub does not use this - it has no scroll and no footer.
 */
export function ContentShell({ places, children, inviteToContest = true }: ContentShellProps): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col bg-straw">
      <SiteHeader places={places} />
      <main className="flex-1">{children}</main>
      <SiteFooter places={places} />
      <LenisProvider />
      <InvitationCard blocked={false} onContestPage={!inviteToContest} delayMs={INVITATION_DELAY_MS} />
    </div>
  );
}
