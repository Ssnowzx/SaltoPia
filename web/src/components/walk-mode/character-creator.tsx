"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  CHARACTERS,
  CHARACTER_KEYS,
  type CharacterConfig,
  type CharacterKey,
  DEFAULT_NAME,
  NAME_MAX_LENGTH,
  OUTFIT_COLORS,
  SKIN_TONES,
} from "@/lib/walk/characters";

/**
 * The character creator: who walks, what they wear, their skin and their name. Every choice
 * changes the character standing in the square behind the panel at once. See the walk-mode
 * spec, "Creating a character".
 */

interface CharacterCreatorProps {
  readonly config: CharacterConfig;
  readonly onChange: (config: CharacterConfig) => void;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

const CHOICE =
  "rounded-button border-2 px-3 py-2 font-sans text-xs font-bold tracking-[0.04em] transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none";
const SWATCH = "h-9 w-9 rounded-full border-2 shadow-sm transition-transform duration-200 hover:scale-110 focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none";

function pressedClass(pressed: boolean): string {
  return pressed ? "border-teal-deep bg-teal-deep text-mist" : "border-bark/15 bg-white/70 text-bark hover:border-teal";
}

function PersonChoices({ config, onChange }: Pick<CharacterCreatorProps, "config" | "onChange">): React.ReactElement {
  return (
    <fieldset>
      <legend className="mb-2 font-sans text-[11px] font-bold tracking-[0.12em] text-teal uppercase">Quem vai passear</legend>
      <div className="grid grid-cols-3 gap-2">
        {CHARACTER_KEYS.map((key: CharacterKey) => (
          <button key={key} type="button" aria-pressed={config.model === key} onClick={() => onChange({ ...config, model: key })} className={`${CHOICE} ${pressedClass(config.model === key)}`}>
            {CHARACTERS[key].label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function SwatchChoices({
  legend,
  options,
  selected,
  onSelect,
}: {
  readonly legend: string;
  readonly options: ReadonlyArray<{ readonly label: string; readonly hex: string | null }>;
  readonly selected: number;
  readonly onSelect: (index: number) => void;
}): React.ReactElement {
  return (
    <fieldset>
      <legend className="mb-2 font-sans text-[11px] font-bold tracking-[0.12em] text-teal uppercase">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            aria-label={option.label}
            aria-pressed={selected === index}
            title={option.label}
            onClick={() => onSelect(index)}
            className={`${SWATCH} ${selected === index ? "scale-110 border-teal-deep" : "border-white"}`}
            style={{ background: option.hex ?? "conic-gradient(#b5543a, #2f5d46, #2d5f8a, #c9953a, #b5543a)" }}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function CharacterCreator({ config, onChange, onConfirm, onCancel }: CharacterCreatorProps): React.ReactElement {
  const first = useRef<HTMLHeadingElement>(null);

  useEffect(() => first.current?.focus({ preventScroll: true }), []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Keys typed here are for the panel, not for walking.
      event.stopPropagation();
      if (event.key === "Escape") onCancel();
    },
    [onCancel],
  );

  return (
    <aside
      role="dialog"
      aria-labelledby="creator-title"
      onKeyDown={onKeyDown}
      className="pointer-events-auto absolute inset-x-3 bottom-3 max-h-[70svh] overflow-y-auto rounded-card bg-mist/95 p-5 shadow-[0_24px_60px_rgba(46,36,28,0.28)] backdrop-blur-sm sm:inset-x-auto sm:top-[92px] sm:right-6 sm:bottom-auto sm:w-[min(380px,calc(100vw-48px))] sm:p-6"
    >
      <p className="font-script text-xl text-teal">Antes de sair a pé</p>
      <h2 id="creator-title" ref={first} tabIndex={-1} className="font-sans text-lg font-extrabold tracking-[0.04em] text-araucaria uppercase focus:outline-none">
        Crie seu personagem
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        <PersonChoices config={config} onChange={onChange} />
        <SwatchChoices legend="Roupa" options={OUTFIT_COLORS} selected={config.outfit} onSelect={(outfit) => onChange({ ...config, outfit })} />
        <SwatchChoices legend="Tom de pele" options={SKIN_TONES} selected={config.skin} onSelect={(skin) => onChange({ ...config, skin })} />
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-[11px] font-bold tracking-[0.12em] text-teal uppercase">Nome</span>
          <input
            type="text"
            value={config.name}
            maxLength={NAME_MAX_LENGTH}
            placeholder={DEFAULT_NAME}
            onChange={(event) => onChange({ ...config, name: event.target.value })}
            className="rounded-button border-2 border-bark/15 bg-white/80 px-3 py-2 font-sans text-sm text-bark focus-visible:border-teal focus-visible:outline-none"
          />
        </label>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full rounded-button bg-teal-deep px-6 py-3.5 font-sans text-sm font-bold tracking-[0.08em] text-mist uppercase transition-colors duration-200 hover:bg-teal-dark focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none"
        >
          Começar a passear
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 font-sans text-xs font-bold tracking-[0.1em] text-teal uppercase underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
          Voltar ao mapa
        </button>
      </div>
      <p className="mt-3 text-center font-sans text-[11px] leading-relaxed text-bark/70">
        Setas ou W A S D para andar · Shift para correr · arraste para girar a câmera · clique no chão para ir até lá
      </p>
    </aside>
  );
}
