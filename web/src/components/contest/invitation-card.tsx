"use client";

import { useEffect, useRef } from "react";

import { INVITATION_KEY, INVITATION_PARAM, shouldInvite } from "@/lib/contest/invitation";
import { pauseSmoothScroll, resumeSmoothScroll } from "@/lib/smooth-scroll";

interface InvitationCardProps {
  /** Something the visitor is using right now; the card waits rather than cover it. */
  readonly blocked: boolean;
  /** The contest's own page, where the card never appears. */
  readonly onContestPage: boolean;
  /** How long the page is left alone before the card arrives. */
  readonly delayMs: number;
}

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(INVITATION_KEY) === "1";
  } catch {
    // Storage can be unavailable; the card then shows once per page instead.
    return false;
  }
}

function markSeen(): void {
  try {
    window.sessionStorage.setItem(INVITATION_KEY, "1");
  } catch {
    // Nothing to remember it in.
  }
}

/**
 * The contest's invitation, opening the visit the way the reference opens its own: a card
 * over the page with the contest's wordmark, a line and a way in.
 *
 * Once a session, on the first page where it is allowed, and never over something the
 * visitor is using - see the contest-invitation spec. It is recorded as seen when it is
 * shown, not when it is closed, so a reload with it open does not show it twice.
 */
export function InvitationCard({ blocked, onContestPage, delayMs }: InvitationCardProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  // `?convite` would otherwise bring it back every time a block ends on the same page.
  const shownOnThisPage = useRef(false);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).has(INVITATION_PARAM);
    const invite = shouldInvite({ seen: readSeen(), forced, isContestPage: onContestPage, blocked });
    if (!invite || shownOnThisPage.current) return;

    const timer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.open) return;
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      shownOnThisPage.current = true;
      markSeen();
      dialog.showModal();
      // The dialog would otherwise hand focus to its first control - the close button -
      // and ring it before the visitor has touched a key. The card takes it instead, and
      // Tab goes on from there.
      cardRef.current?.focus({ preventScroll: true });
      pauseSmoothScroll();
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [blocked, onContestPage, delayMs]);

  const close = (): void => dialogRef.current?.close();

  const handleClosed = (): void => {
    resumeSmoothScroll();
    returnFocus.current?.focus({ preventScroll: true });
  };

  // A click on the dialog itself, not on its content, is a click on the backdrop.
  const closeOnBackdrop = (event: React.MouseEvent<HTMLDialogElement>): void => {
    if (event.target === event.currentTarget) close();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClosed}
      onClick={closeOnBackdrop}
      aria-labelledby="invitation-title"
      aria-describedby="invitation-text"
      data-lenis-prevent
      className="invitation-dialog m-auto w-[min(92vw,560px)] overflow-visible bg-transparent p-0"
    >
      <div className="flex flex-col items-center">
        {/* The contest's wordmark sits across the top edge of the card, as a badge. */}
        <div aria-hidden="true" className="relative z-[1] -mb-9 flex flex-col items-center sm:-mb-11">
          <span className="relative inline-block font-sans text-[clamp(2.5rem,9vw,4.5rem)] leading-[0.9] font-extrabold tracking-[-0.02em] uppercase">
            <span className="absolute inset-0 translate-x-[0.04em] translate-y-[0.045em] text-night">Embaixador</span>
            <span className="photo-type relative">Embaixador</span>
          </span>
          <span className="-mt-1 -rotate-2 bg-wine px-8 py-1.5 font-sans text-sm font-extrabold tracking-[0.18em] text-mist uppercase shadow-[0_8px_18px_color-mix(in_srgb,var(--color-night)_30%,transparent)] [clip-path:polygon(0_0,100%_0,95%_50%,100%_100%,0_100%,5%_50%)] sm:text-base">
            de Saltopia
          </span>
        </div>

        <div
          ref={cardRef}
          tabIndex={-1}
          className="grain relative w-full rounded-card bg-mist px-7 pt-16 pb-8 text-center outline-none shadow-[0_40px_90px_color-mix(in_srgb,var(--color-night)_45%,transparent)] sm:px-12 sm:pt-20 sm:pb-10"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-night/70 transition-colors hover:bg-night/5 hover:text-night focus-visible:ring-4 focus-visible:ring-wine/35 focus-visible:outline-none"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>

          <p className="font-script text-4xl text-wine sm:text-5xl">Saltopia precisa de você</p>
          <h2 id="invitation-title" className="mt-3 font-sans text-2xl leading-tight font-extrabold tracking-[0.02em] text-balance text-night uppercase sm:text-3xl">
            Um ano de Serra na sua mesa
          </h2>
          <p id="invitation-text" className="mx-auto mt-4 max-w-sm font-sans text-base leading-relaxed text-bark/85 sm:text-lg">
            Mostre a Serra do seu jeito - uma receita de pinhão, uma trilha, a geada da manhã - e dispute o título de Embaixador de Saltopia.
          </p>

          <div className="mt-7 flex flex-col items-center gap-2">
            <a
              href="/embaixador"
              className="rounded-button bg-night px-8 py-3.5 font-sans text-sm font-bold tracking-[0.1em] text-mist uppercase shadow-[0_12px_28px_color-mix(in_srgb,var(--color-night)_30%,transparent)] transition-colors duration-200 hover:bg-wine focus-visible:ring-4 focus-visible:ring-wine/35 focus-visible:outline-none"
            >
              Quero me candidatar
            </a>
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 font-sans text-xs font-bold tracking-[0.12em] text-wine uppercase underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Agora não
            </button>
          </div>

          <p className="mt-4 font-sans text-[11px] text-bark/55">Concurso fictício de um trabalho acadêmico.</p>
        </div>
      </div>
    </dialog>
  );
}
