/**
 * When the contest invitation may appear - kept pure so the rules can be tested without a
 * browser. The component reads the session and the page, asks here, and waits.
 */

/** Where the session remembers that the invitation has been shown. */
export const INVITATION_KEY = "saltopia:invitation";

/** The address parameter that shows the invitation regardless, for a demonstration. */
export const INVITATION_PARAM = "convite";

export interface InvitationState {
  /** Already shown in this session. */
  readonly seen: boolean;
  /** Asked for by the address. */
  readonly forced: boolean;
  /** The contest's own page, where inviting to it would be noise. */
  readonly isContestPage: boolean;
  /** Something the visitor is using right now: the title state, a place card, the character creator. */
  readonly blocked: boolean;
}

/**
 * Whether the invitation should be on its way. Being forced overrides only having been
 * seen - never the contest page, and never covering what the visitor is using.
 */
export function shouldInvite({ seen, forced, isContestPage, blocked }: InvitationState): boolean {
  if (isContestPage || blocked) return false;
  return forced || !seen;
}
