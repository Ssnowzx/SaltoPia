/**
 * Glyphs for the map pins, one per place, drawn white on the pin's disc.
 *
 * Paths are on a 24x24 grid. Simple silhouettes read at 20px; anything finer does not.
 */
export const PIN_ICONS: Readonly<Record<string, string>> = {
  "praca-do-pinhao":
    "M4 11l8-6 8 6v2H4zM6 14h12v1.5H6zM7 16h2v5H7zM11 16h2v5h-2zM15 16h2v5h-2z",
  "galpao-do-fogo":
    "M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 2 4 1-2 1-5 1-7z",
  "mirante-da-neblina":
    "M2 19l6-9 4 6 3-4 7 7zM17 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
  "bosque-das-araucarias":
    "M12 3l5 4h-3l3 3.5h-3l3 3.5h-4v7h-2v-7H7l3-3.5H7L10 7H7z",
  "vinicola-de-altitude":
    "M12 3c2 0 3 1 3 2.5-1 0-2 .5-3 1.5-1-1-2-1.5-3-1.5C9 4 10 3 12 3zM8 8a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 8 8zM12 8a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 12 8zM16 8a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 16 8zM10 12.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM14 12.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM12 17a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 12 17z",
  "ctg-porteira-do-tropeiro":
    "M4 4h2.2v16H4zM17.8 4H20v16h-2.2zM4 5h16v2H4zM7 10h10v1.6H7zM7 14h10v1.6H7z",
  "estacao-velha":
    "M7 3h10a2.5 2.5 0 0 1 2.5 2.5V15a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 15V5.5A2.5 2.5 0 0 1 7 3zm1 3.5v4.5h8V6.5zM8 13a1.4 1.4 0 1 0 0 2.8A1.4 1.4 0 0 0 8 13zm8 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM6.5 18.5L4.5 22h2.2l1-1.6h8.6l1 1.6h2.2l-2-3.5z",
  "pousada-da-geada":
    "M12 3.5l8.5 7.5h-2.3v8H5.8v-8H3.5zM15.5 5h2v4.2l-2-1.8zM10 13.5h4v5.5h-4z",
  "fazenda-do-cedro":
    "M3 11l9-7 9 7v2h-2v8H5v-8H3zM8 15h8v6H8zM10 15v6M14 15v6M8 18h8",
  "fazenda-santa-barbara":
    "M4 10l7-6 7 6v11H4zM9 14h4v7H9zM16.5 8h3v13h-3zM17 5.5a1.5 1.5 0 1 1 2 1.4V8h-2z",
  "fazenda-dos-pinheiros":
    "M12 2l4 5h-2.4l3 4h-2.4l3 4.2h-3.6V21h-1.2v-5.8H8.8l3-4.2H9.4l3-4H10z",
  "parque-caveiras":
    "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6zM11.2 5h1.6v14h-1.6zM5 11.2h14v1.6H5zM7.2 6.1l1.1-1.1 9.7 9.7-1.1 1.1zM16 5l1.1 1.1-9.7 9.7L6.3 14.7z",
  "deck-do-lago":
    "M7 3h1.6v6.2c0 1-.6 1.6-1.4 1.9V21H5.6v-9.9C4.7 10.8 4 10.1 4 9.2V3h1.6v5.8h.7V3h.7v5.8h.7zM14.5 3c2.2 0 3.5 2.4 3.5 5.2 0 2.2-.9 3.9-2.2 4.6V21h-1.6v-8.2c-1.3-.7-2.2-2.4-2.2-4.6C12 5.4 13.3 3 14.5 3z",
  "porto-de-ovnis":
    "M12 4c4.4 0 8 1.6 8 3.6S16.4 11.2 12 11.2 4 9.6 4 7.6 7.6 4 12 4zm0 1.6c-2.6 0-4.8.9-4.8 2s2.2 2 4.8 2 4.8-.9 4.8-2-2.2-2-4.8-2zM9 13l6 0-1.2 7.6h-3.6zM6.5 12.4l1.6 1.2-1.1 1.4-1.6-1.2zM17.5 12.4l1.1 1.4-1.6 1.2-1.1-1.4z",
  "salto-caveiras":
    "M8.5 3h7v3c0 4 2 6.5 4.5 8.5V21H4v-6.5C6.5 12.5 8.5 10 8.5 6zM10.5 5v1.5c0 3.2-1.2 5.8-3.2 8h9.4c-2-2.2-3.2-4.8-3.2-8V5z",
};

/** A generic marker for a place without its own glyph. */
export const DEFAULT_PIN_ICON = "M12 3a6 6 0 0 1 6 6c0 4.5-6 12-6 12S6 13.5 6 9a6 6 0 0 1 6-6zm0 3.5A2.5 2.5 0 1 0 12 11a2.5 2.5 0 0 0 0-4.5z";
