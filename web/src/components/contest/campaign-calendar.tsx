import { Reveal } from "@/components/content/reveal";
import type { CampaignStatus } from "@/lib/contest/campaign";
import type { CampaignPhaseContent } from "@/lib/contest/content";

import { Sparkle } from "./sparkle";

interface CampaignCalendarProps {
  readonly phases: readonly CampaignPhaseContent[];
  readonly status: CampaignStatus;
}

/** The map's own pin, so the calendar reads as a trail across Saltopia. */
const PIN = "M16 0C7.2 0 0 7 0 15.6 0 27.4 16 42 16 42s16-14.6 16-26.4C32 7 24.8 0 16 0Z";

/** What the handwritten note beside a stop says, or nothing. */
function noteFor(index: number, status: CampaignStatus): string | null {
  if (status.kind === "running" && status.index === index) return "Agora";
  if (status.kind === "upcoming" && status.index === index) return "A seguir";
  return null;
}

/**
 * The campaign as a trail: three stops joined by a dashed path, the one running today
 * marked in gold with a handwritten "Agora" and an arrow. Between phases the next one is
 * marked "A seguir"; after the last, a seal says the campaign is over.
 */
export function CampaignCalendar({ phases, status }: CampaignCalendarProps): React.ReactElement {
  return (
    <section className="relative bg-wine text-mist">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <Reveal as="div" className="text-center">
          <p className="font-script text-5xl text-gold sm:text-6xl">Calendário</p>
          <h2 className="mt-1 flex items-center justify-center gap-3 font-sans text-[clamp(2.5rem,7vw,5.5rem)] leading-none font-extrabold tracking-[0.01em] uppercase sm:gap-5">
            <Sparkle />
            Da campanha
            <Sparkle />
          </h2>
        </Reveal>

        <Reveal as="div" className="relative mt-16 sm:mt-20">
          {/* The trail: across on a wide screen, down on a narrow one. */}
          <svg className="absolute top-[26px] left-[16%] hidden h-10 w-[68%] md:block" viewBox="0 0 680 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 20C120 -6 220 46 340 20S560 -6 680 20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="8 10" className="text-gold/70" />
          </svg>
          <div aria-hidden="true" className="absolute top-4 bottom-4 left-[31px] border-l-[3px] border-dashed border-gold/60 md:hidden" />

          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {phases.map((phase, index) => {
              const note = noteFor(index, status);
              const lit = note !== null;
              return (
                <li key={phase.starts} className="relative flex gap-6 md:flex-col md:items-center md:text-center">
                  {note ? (
                    <p className="absolute -top-14 left-16 flex items-end gap-1 font-script text-3xl text-gold md:left-auto md:right-[62%]">
                      {note}
                      <svg viewBox="0 0 60 40" className="h-8 w-12" aria-hidden="true">
                        <path d="M2 8C22 4 40 12 50 32M50 32l-10-3M50 32l2-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </p>
                  ) : null}
                  <svg viewBox="0 0 32 42" className={`h-16 w-12 shrink-0 drop-shadow-lg ${lit ? "text-gold" : "text-mist/35"}`} aria-hidden="true">
                    <path d={PIN} fill="currentColor" />
                    <circle cx="16" cy="15.5" r="6" className="fill-wine" />
                  </svg>
                  <div className={`rounded-card border-2 p-6 md:w-full ${lit ? "border-gold bg-mist text-night" : "border-mist/20 bg-wine"}`}>
                    <p className={`inline-block rounded-pill px-3 py-1 font-sans text-sm font-extrabold tracking-[0.06em] ${lit ? "bg-wine text-mist" : "bg-mist/10 text-gold"}`}>
                      {phase.dates}
                    </p>
                    <h3 className="mt-3 font-sans text-2xl font-extrabold uppercase">{phase.title}</h3>
                    <p className={`mt-2 font-sans text-base font-semibold ${lit ? "text-night/80" : "text-mist/80"}`}>{phase.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {status.kind === "finished" ? (
            <p className="mx-auto mt-12 w-max -rotate-3 rounded-full border-4 border-gold px-8 py-4 font-sans text-2xl font-extrabold tracking-[0.2em] text-gold uppercase">
              Encerrado
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
