/**
 * The contest's calendar and idea deck, as pure functions so the page's two moving parts
 * can be tested without a browser or a clock.
 *
 * Dates are `YYYY-MM-DD` strings. Compared as strings they sort as dates, and a string has
 * no time of day to drift across a time-zone boundary; "today" is worked out once, in the
 * community's own zone, and everything after that is plain comparison.
 */

/** One phase of the campaign. Both ends are inclusive. */
export interface CampaignPhase {
  readonly starts: string;
  readonly ends: string;
}

/** Where the campaign stands on a given day. */
export type CampaignStatus =
  | { readonly kind: "upcoming"; readonly index: number }
  | { readonly kind: "running"; readonly index: number }
  | { readonly kind: "finished" };

/** The community's time zone: the calendar turns at midnight in Lages, not in UTC. */
export const CAMPAIGN_TIME_ZONE = "America/Sao_Paulo";

/** A date as `YYYY-MM-DD` in the given zone. The `en-CA` locale formats exactly that way. */
export function calendarDate(now: Date, timeZone: string = CAMPAIGN_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/**
 * The phase running on `today`, or the next one to come, or the end of the campaign.
 * Phases must be given in order.
 */
export function campaignStatus(today: string, phases: readonly CampaignPhase[]): CampaignStatus {
  for (const [index, phase] of phases.entries()) {
    if (today < phase.starts) return { kind: "upcoming", index };
    if (today <= phase.ends) return { kind: "running", index };
  }
  return { kind: "finished" };
}

/**
 * The idea dealt after `index`. Walking the deck in order is what guarantees every idea
 * is seen once before any comes back - a random deal repeats long before it runs out.
 */
export function nextIdea(index: number, count: number): number {
  if (count <= 0) return 0;
  return (index + 1) % count;
}
