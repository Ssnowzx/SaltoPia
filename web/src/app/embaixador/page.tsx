import type { Metadata } from "next";

import { ContentShell } from "@/components/content/content-shell";
import { CampaignCalendar } from "@/components/contest/campaign-calendar";
import { ContestHero } from "@/components/contest/contest-hero";
import { HowToRun } from "@/components/contest/how-to-run";
import { IdeasSection } from "@/components/contest/ideas-section";
import { PrizeBand } from "@/components/contest/prize-band";
import { Rulebook } from "@/components/contest/rulebook";
import { calendarDate, campaignStatus } from "@/lib/contest/campaign";
import { CONTEST_NAME, CONTEST_PHOTOS, PHASES } from "@/lib/contest/content";
import { getPlaces } from "@/lib/places";
import { presentOrNull } from "@/lib/public-file";

/**
 * The calendar marks the phase running on the day the page is viewed, so the page is
 * rebuilt at most an hour after it goes stale rather than frozen at build time.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: CONTEST_NAME,
  description: "Mostre por que você é a cara da Serra e concorra a um ano de produtos dos parceiros de Saltopia. Concurso fictício de um trabalho acadêmico.",
  openGraph: {
    title: `${CONTEST_NAME} | Saltopia`,
    description: "Um ano de Serra na sua mesa. Concurso fictício de um trabalho acadêmico.",
    images: [{ url: "/images/heroes/salto-caveiras.webp", width: 1600, height: 900, alt: "O Salto do Rio Caveiras" }],
  },
};

/**
 * The ambassador contest - Saltopia's take on the reference's "be the mayor" page: the
 * same sequence of invitation, how to run, ideas, calendar and prize, with its own title,
 * words, colours and shapes. It is fictional and says so; it has no form and sends
 * nothing.
 */
export default async function ContestPage(): Promise<React.ReactElement> {
  const places = await getPlaces();
  const status = campaignStatus(calendarDate(new Date()), PHASES);

  return (
    <ContentShell places={places} inviteToContest={false}>
      <ContestHero />
      <HowToRun cookPhoto={presentOrNull(CONTEST_PHOTOS.cook.path)} gauchoPhoto={presentOrNull(CONTEST_PHOTOS.gaucho.path)} />
      <IdeasSection />
      <CampaignCalendar phases={PHASES} status={status} />
      <PrizeBand places={places} photo={presentOrNull(CONTEST_PHOTOS.prize.path)} />
      <Rulebook />
    </ContentShell>
  );
}
