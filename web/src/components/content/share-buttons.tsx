"use client";

import { useState } from "react";

interface ShareButtonsProps {
  readonly title: string;
  readonly path: string;
  /** `dark` sits on a saturated ground, `light` on a pale one. */
  readonly tone: "dark" | "light";
}

/** How long "copied" stays on screen. */
const COPIED_FOR_MS = 2200;

const BASE =
  "rounded-button px-6 py-3 font-sans text-sm font-bold tracking-[0.1em] uppercase transition duration-200 focus-visible:ring-4 focus-visible:outline-none";

const STYLES = {
  dark: {
    primary: `${BASE} bg-gold text-araucaria hover:scale-105 focus-visible:ring-mist/50`,
    secondary: `${BASE} border-2 border-mist/70 text-mist hover:bg-mist/10 focus-visible:ring-mist/50`,
  },
  light: {
    primary: `${BASE} bg-[var(--place-accent)] text-mist hover:scale-105 focus-visible:ring-[var(--place-accent)]/30`,
    secondary: `${BASE} border-2 border-[var(--place-accent)] text-[var(--place-ink)] hover:bg-[var(--place-accent)]/10 focus-visible:ring-[var(--place-accent)]/30`,
  },
} as const;

/**
 * Share this page: the system share sheet where there is one, WhatsApp, and a copied
 * link. The URL is read from the document at click time, so the buttons do not need to
 * know where the site is deployed.
 */
export function ShareButtons({ title, path, tone }: ShareButtonsProps): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const styles = STYLES[tone];

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
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={share} className={styles.primary}>
        Compartilhar
      </button>
      <button type="button" onClick={whatsapp} className={styles.secondary}>
        WhatsApp
      </button>
      <button type="button" onClick={copyLink} className={styles.secondary} aria-live="polite">
        {copied ? "Link copiado" : "Copiar link"}
      </button>
    </div>
  );
}
