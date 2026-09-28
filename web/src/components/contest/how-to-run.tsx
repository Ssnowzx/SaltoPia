import { Reveal } from "@/components/content/reveal";
import { CONTEST_HANDLE, CONTEST_HASHTAG, HOW_TO_STEPS, SUGGESTIONS } from "@/lib/contest/content";

import { ContestPhoto } from "./contest-photo";
import { Sparkle } from "./sparkle";

interface HowToRunProps {
  /** The two photographs of people taking part, each null until it exists. */
  readonly cookPhoto: string | null;
  readonly gauchoPhoto: string | null;
}

/** A round wine badge with a drawn camera or play mark - no platform's logo. */
function MediaBadge({ kind, className }: { readonly kind: "photo" | "video"; readonly className: string }): React.ReactElement {
  return (
    <span aria-hidden="true" className={`absolute flex size-16 items-center justify-center rounded-full bg-wine shadow-lg ring-4 ring-gold ${className}`}>
      <svg viewBox="0 0 24 24" className="size-8 text-mist" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        {kind === "photo" ? (
          <>
            <rect x="3" y="6.5" width="18" height="13" rx="3" />
            <circle cx="12" cy="13" r="3.6" />
            <path d="M8.5 6.5 10 4h4l1.5 2.5" />
          </>
        ) : (
          <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
        )}
      </svg>
    </span>
  );
}

/**
 * How to run: three steps with their key words picked out in gold, what a post can be
 * about, the hashtag and the handle, and two people already campaigning. The fine print
 * says, before anything else can, that none of it is real.
 */
export function HowToRun({ cookPhoto, gauchoPhoto }: HowToRunProps): React.ReactElement {
  return (
    <section id="como-participar" className="relative overflow-hidden bg-night text-mist">
      <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <figure className="mx-auto mb-14 grid max-w-md grid-cols-2 gap-8 xl:contents">
          <div className="relative -rotate-6 rounded-[10px] bg-gold p-2 shadow-2xl xl:absolute xl:top-40 xl:-left-6 xl:w-44">
            <ContestPhoto src={cookPhoto} label="Receita de pinhão" sizes="240px" className="aspect-[3/4] rounded-[6px]" />
            <MediaBadge kind="video" className="-right-5 -bottom-5" />
          </div>
          <div className="relative rotate-[5deg] rounded-[10px] bg-gold p-2 shadow-2xl xl:absolute xl:-right-6 xl:bottom-36 xl:w-44">
            <ContestPhoto src={gauchoPhoto} label="Chimarrão ao amanhecer" sizes="240px" className="aspect-[3/4] rounded-[6px]" />
            <MediaBadge kind="photo" className="-top-5 -left-5" />
          </div>
        </figure>

        <Reveal as="div" className="relative mx-auto max-w-2xl text-center">
          <p className="font-script text-5xl text-frost sm:text-6xl">Como se</p>
          <h2 className="mt-1 flex items-center justify-center gap-3 font-sans text-[clamp(2.5rem,7vw,5.5rem)] leading-none font-extrabold tracking-[0.01em] uppercase sm:gap-5">
            <Sparkle />
            Candidatar
            <Sparkle />
          </h2>

          <ol className="mt-12 space-y-5 text-left">
            {HOW_TO_STEPS.map((step, index) => (
              <li key={step.highlight} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gold font-sans text-lg font-extrabold text-gold">{index + 1}</span>
                <p className="pt-1.5 font-sans text-xl leading-snug font-extrabold sm:text-2xl">
                  {step.before}
                  <mark className="rounded-[4px] bg-gold px-1.5 text-night [box-decoration-break:clone]">{step.highlight}</mark>
                  {step.after}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-12 font-sans text-sm font-bold tracking-[0.28em] text-frost uppercase">Pode ser</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2.5">
            {SUGGESTIONS.map((suggestion) => (
              <li key={suggestion} className="rounded-pill border-2 border-mist/25 px-4 py-2 font-sans text-sm font-semibold text-mist/90">
                {suggestion}
              </li>
            ))}
          </ul>

          <p className="mt-10 font-sans text-lg font-extrabold">
            Use <span className="rounded-[4px] bg-wine px-2 py-0.5">{CONTEST_HASHTAG}</span> e marque{" "}
            <span className="rounded-[4px] bg-wine px-2 py-0.5">{CONTEST_HANDLE}</span>.
          </p>

          <p className="mx-auto mt-10 max-w-xl font-sans text-xs leading-relaxed text-mist/60">
            Concurso fictício, criado para um trabalho acadêmico. Nenhuma inscrição é recebida, nenhum dado é coletado e nenhum prêmio é entregue. As datas e os
            parceiros existem só dentro de Saltopia.
          </p>
          <a
            href="#regulamento"
            className="mt-6 inline-block rounded-button bg-mist px-6 py-3 font-sans text-sm font-bold tracking-[0.1em] text-night uppercase transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-gold focus-visible:outline-none"
          >
            Ler o regulamento
          </a>
        </Reveal>
      </div>
    </section>
  );
}
