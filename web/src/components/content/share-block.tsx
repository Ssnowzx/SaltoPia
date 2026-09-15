"use client";

import { useState } from "react";

interface ShareBlockProps {
  readonly title: string;
  readonly path: string;
}

/** How long "copied" stays on screen. */
const COPIED_FOR_MS = 2200;

/**
 * Share this page: the system share sheet where there is one, WhatsApp, and a copied
 * link. The URL is read from the document at click time, so the block does not need to
 * know where the site is deployed.
 */
export function ShareBlock({ title, path }: ShareBlockProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const url = (): string => `${window.location.origin}${path}`;

  const copyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(url());
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_FOR_MS);
  };

  const share = async (): Promise<void> => {
    if (typeof navigator.share === "function") {
      await navigator.share({ title, url: url() }).catch(() => undefined);
      return;
    }
    await copyLink();
  };

  const whatsapp = (): void => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} — ${url()}`)}`, "_blank", "noopener");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
      <div className="rounded-card bg-[var(--place-accent)] px-6 py-10 text-center text-mist sm:px-12">
        <p className="font-script text-3xl text-gold">Leve alguém junto</p>
        <h2 className="mt-1 font-sans text-2xl font-extrabold tracking-[0.03em] uppercase sm:text-3xl">Compartilhe {title}</h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={share} className="rounded-button bg-gold px-6 py-3 font-sans text-sm font-bold tracking-[0.1em] text-araucaria uppercase transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-mist/50 focus-visible:outline-none">
            Compartilhar
          </button>
          <button type="button" onClick={whatsapp} className="rounded-button border-2 border-mist/70 px-6 py-3 font-sans text-sm font-bold tracking-[0.1em] uppercase transition-colors duration-200 hover:bg-mist/10 focus-visible:ring-4 focus-visible:ring-mist/50 focus-visible:outline-none">
            WhatsApp
          </button>
          <button type="button" onClick={copyLink} className="rounded-button border-2 border-mist/70 px-6 py-3 font-sans text-sm font-bold tracking-[0.1em] uppercase transition-colors duration-200 hover:bg-mist/10 focus-visible:ring-4 focus-visible:ring-mist/50 focus-visible:outline-none" aria-live="polite">
            {copied ? "Link copiado" : "Copiar link"}
          </button>
        </div>
      </div>
    </div>
  );
}
