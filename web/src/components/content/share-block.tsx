import { ShareButtons } from "./share-buttons";

interface ShareBlockProps {
  readonly title: string;
  readonly path: string;
}

/** Share this page, on a card of the place's colour - the experience page's closing band. */
export function ShareBlock({ title, path }: ShareBlockProps): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
      <div className="rounded-card bg-[var(--place-accent)] px-6 py-10 text-center text-mist sm:px-12">
        <p className="font-script text-3xl text-gold">Leve alguém junto</p>
        <h2 className="mt-1 font-sans text-2xl font-extrabold tracking-[0.03em] uppercase sm:text-3xl">Compartilhe {title}</h2>
        <div className="mt-8 flex justify-center">
          <ShareButtons title={title} path={path} tone="dark" />
        </div>
      </div>
    </div>
  );
}
