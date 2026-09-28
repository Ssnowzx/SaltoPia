"use client";

import { useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { nextIdea } from "@/lib/contest/campaign";
import type { CampaignIdea, IdeaSuit } from "@/lib/contest/content";

interface IdeaDeckProps {
  readonly ideas: readonly CampaignIdea[];
}

/** Matches `--duration-deal` in globals.css: how long the front card takes to leave. */
const DEAL_MS = 450;

/**
 * Where each of the three visible cards lies: the front one square, the two behind fanned
 * out - less on a phone, where a full fan runs off the screen.
 */
const SLOTS = [
  "z-30 translate-x-0 rotate-0 scale-100",
  "z-20 -translate-x-[16%] -rotate-[6deg] scale-95 sm:-translate-x-[34%] sm:-rotate-[9deg]",
  "z-10 translate-x-[16%] rotate-[6deg] scale-95 sm:translate-x-[34%] sm:rotate-[9deg]",
] as const;

const SUIT_PATHS: Readonly<Record<IdeaSuit, string>> = {
  pinhao: "M12 1C17 1 20 8 20 14s-3.6 10-8 10-8-4-8-10S7 1 12 1Z",
  araucaria: "M11 24V13h2v11Z M2 9Q7 12 12 10Q17 12 22 9L19 14Q12 17 5 14Z M5 5Q12 8 19 5L17 9Q12 11 7 9Z",
  gota: "M12 1C12 1 20 11 20 16a8 8 0 0 1-16 0C4 11 12 1 12 1Z",
  estrela: "M12 1l3.2 7 7.6.7-5.8 5 1.8 7.5L12 17.3 5.2 21.2 7 13.7l-5.8-5 7.6-.7Z",
};

function Suit({ suit, className }: { readonly suit: IdeaSuit; readonly className: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 25" className={className} aria-hidden="true" focusable="false">
      <path d={SUIT_PATHS[suit]} fill="currentColor" />
    </svg>
  );
}

/**
 * Campaign ideas as a hand of truco cards - the Serra's own card game. The front card
 * holds an idea; "Outra ideia" throws it off the table and the next steps forward, so the
 * whole deck is seen before any idea comes round again. Under reduced motion the new idea
 * simply replaces the old one.
 */
export function IdeaDeck({ ideas }: IdeaDeckProps): React.ReactElement {
  const reducedMotion = usePrefersReducedMotion();
  const [front, setFront] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);

  // A card still in the air when the page goes away must not land on an unmounted deck.
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const deal = (): void => {
    if (leaving) return;
    if (reducedMotion) {
      setFront((current) => nextIdea(current, ideas.length));
      return;
    }
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setFront((current) => nextIdea(current, ideas.length));
      setLeaving(false);
    }, DEAL_MS);
  };

  const visible = [0, 1, 2].map((offset) => (front + offset) % ideas.length);
  const current = ideas[front];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[420px] w-full max-w-[520px] sm:h-[460px]">
        {visible
          .map((ideaIndex, slot) => ({ ideaIndex, slot }))
          .reverse()
          .map(({ ideaIndex, slot }) => (
            <IdeaCard key={ideaIndex} idea={ideas[ideaIndex]} slot={slot} leaving={slot === 0 && leaving} />
          ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {current ? `${current.title}: ${current.text}` : ""}
      </p>
      <button
        type="button"
        onClick={deal}
        className="mt-6 rounded-button bg-wine px-7 py-3.5 font-sans text-sm font-bold tracking-[0.1em] text-mist uppercase shadow-[0_12px_28px_color-mix(in_srgb,var(--color-wine)_35%,transparent)] transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-wine/30 focus-visible:outline-none"
      >
        Outra ideia
      </button>
    </div>
  );
}

interface IdeaCardProps {
  readonly idea: CampaignIdea;
  readonly slot: number;
  readonly leaving: boolean;
}

function IdeaCard({ idea, slot, leaving }: IdeaCardProps): React.ReactElement {
  const isFront = slot === 0;
  return (
    <div
      aria-hidden={!isFront}
      data-leaving={leaving}
      className={`deck-card absolute top-4 left-1/2 -ml-[140px] h-[380px] w-[280px] rounded-[20px] border-4 border-gold p-3 shadow-[0_24px_50px_color-mix(in_srgb,var(--color-night)_28%,transparent)] sm:-ml-[150px] sm:h-[420px] sm:w-[300px] ${SLOTS[slot] ?? SLOTS[2]} ${
        isFront ? "grain bg-mist" : slot === 1 ? "bg-wine" : "bg-night"
      }`}
    >
      <div className={`relative flex h-full flex-col items-center justify-center rounded-[12px] border-2 px-6 text-center ${isFront ? "border-gold/60" : "border-gold/40"}`}>
        <Suit suit={idea.suit} className={`absolute top-3 left-3 size-6 ${isFront ? "text-wine" : "text-gold"}`} />
        <Suit suit={idea.suit} className={`absolute right-3 bottom-3 size-6 rotate-180 ${isFront ? "text-wine" : "text-gold"}`} />
        {isFront ? (
          <>
            <p className="font-script text-4xl leading-tight text-wine">{idea.title}</p>
            <p className="mt-4 font-sans text-lg leading-snug font-extrabold text-night">{idea.text}</p>
          </>
        ) : (
          <Suit suit={idea.suit} className="size-24 text-gold" />
        )}
      </div>
    </div>
  );
}
