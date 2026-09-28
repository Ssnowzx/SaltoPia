import { Reveal } from "@/components/content/reveal";
import { RULES } from "@/lib/contest/content";

/**
 * The rulebook, as questions that open. The first one is open from the start: it is the
 * one that says the contest is fictional, and nobody should have to click to learn that.
 */
export function Rulebook(): React.ReactElement {
  return (
    <section id="regulamento" className="grain relative bg-mist">
      <div className="mx-auto w-full max-w-3xl px-5 py-24 sm:px-8">
        <Reveal as="div">
          <p className="text-center font-script text-4xl text-wine sm:text-5xl">Letra miúda</p>
          <h2 className="mt-1 text-center font-sans text-4xl font-extrabold tracking-[0.02em] text-night uppercase sm:text-5xl">Regulamento</h2>
          <div className="mt-12 divide-y-2 divide-night/10 border-y-2 border-night/10">
            {RULES.map((rule, index) => (
              <details key={rule.question} open={index === 0} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-sans text-lg font-extrabold text-night [&::-webkit-details-marker]:hidden">
                  {rule.question}
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-wine text-mist transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl font-sans text-base leading-relaxed text-bark/85">{rule.answer}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
