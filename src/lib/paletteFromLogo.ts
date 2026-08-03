/**
 * Génération d'une charte graphique à partir d'un logo.
 *
 * - Extraction des couleurs dominantes (quantification simple en cube 4x4x4)
 * - Dérivation d'une palette complète (primaire, secondaire, accentuation,
 *   boutons, menus, titres, fonds, textes) au format HSL Tailwind ("H S% L%")
 * - Garantie de lisibilité : la couleur de texte posée sur un fond est choisie
 *   en fonction de la luminance relative du fond.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Palette {
  primary: string;
  primary_foreground: string;
  secondary: string;
  secondary_foreground: string;
  accent: string;
  accent_foreground: string;
  button: string;
  button_foreground: string;
  menu: string;
  menu_foreground: string;
  heading: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export const PALETTE_KEYS: Array<keyof Palette> = [
  "primary",
  "primary_foreground",
  "secondary",
  "secondary_foreground",
  "accent",
  "accent_foreground",
  "button",
  "button_foreground",
  "menu",
  "menu_foreground",
  "heading",
  "background",
  "foreground",
  "muted",
  "border",
];

export const PALETTE_LABELS: Record<keyof Palette, string> = {
  primary: "Couleur principale",
  primary_foreground: "Texte sur couleur principale",
  secondary: "Couleur secondaire",
  secondary_foreground: "Texte sur couleur secondaire",
  accent: "Couleur d'accentuation",
  accent_foreground: "Texte sur accentuation",
  button: "Boutons",
  button_foreground: "Texte des boutons",
  menu: "Menus",
  menu_foreground: "Texte des menus",
  heading: "Titres",
  background: "Arrière-plan",
  foreground: "Texte courant",
  muted: "Fond secondaire",
  border: "Bordures",
};

/* ------------------------------------------------------------------ */
/* Conversions                                                         */
/* ------------------------------------------------------------------ */

export function rgbToHsl({ r, g, b }: Rgb): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslString(h: number, s: number, l: number): string {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  return `${((Math.round(h) % 360) + 360) % 360} ${clamp(Math.round(s), 0, 100)}% ${clamp(Math.round(l), 0, 100)}%`;
}

export function parseHsl(token: string): [number, number, number] | null {
  const m = token.trim().match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Convertit un token HSL Tailwind en couleur hexadécimale (pour <input type="color">). */
export function hslTokenToHex(token: string): string {
  const parsed = parseHsl(token);
  if (!parsed) return "#000000";
  const [h, s, l] = parsed;
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const v = ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * v);
  };
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/** Convertit une couleur hexadécimale en token HSL Tailwind. */
export function hexToHslToken(hex: string): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const [h, s, l] = rgbToHsl({ r, g, b });
  return hslString(h, s, l);
}

/** Luminance relative (WCAG). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const chan = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

/** Texte lisible (clair ou sombre) sur un fond donné en token HSL. */
export function readableForeground(token: string): string {
  const hex = hslTokenToHex(token);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return relativeLuminance({ r, g, b }) > 0.45 ? "222 47% 11%" : "0 0% 100%";
}

/* ------------------------------------------------------------------ */
/* Extraction depuis le logo                                           */
/* ------------------------------------------------------------------ */

/**
 * Extrait les couleurs dominantes d'une image (URL ou data URL).
 * Ignore les pixels transparents, quasi-blancs et quasi-noirs.
 */
export async function extractDominantColors(src: string, max = 5): Promise<Rgb[]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Impossible de charger le logo pour l'analyse des couleurs"));
    img.src = src;
  });

  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxc = Math.max(r, g, b);
    const minc = Math.min(r, g, b);
    // Ignore blanc/noir/gris très neutres
    if (maxc > 245 && minc > 245) continue;
    if (maxc < 18) continue;
    const key = ((r >> 6) << 4) | ((g >> 6) << 2) | (b >> 6);
    const cur = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    cur.count += 1;
    cur.r += r;
    cur.g += g;
    cur.b += b;
    buckets.set(key, cur);
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
    .map((c) => ({
      r: Math.round(c.r / c.count),
      g: Math.round(c.g / c.count),
      b: Math.round(c.b / c.count),
    }));
}

/** Palette par défaut si aucun logo n'est fourni. */
export const DEFAULT_PALETTE: Palette = buildPaletteFromHsl(220, 90, 50, 200, 70, 45);

/** Construit une palette complète à partir de couleurs dominantes. */
export function buildPalette(colors: Rgb[]): Palette {
  if (!colors.length) return DEFAULT_PALETTE;
  const [h1, s1, l1] = rgbToHsl(colors[0]);
  const second = colors[1] ? rgbToHsl(colors[1]) : [(h1 + 180) % 360, s1, l1];
  return buildPaletteFromHsl(h1, s1, l1, second[0], second[1], second[2]);
}

export function buildPaletteFromHsl(
  h1: number,
  s1: number,
  l1: number,
  h2: number,
  s2: number,
  l2: number
): Palette {
  // Normalise la luminosité de la couleur principale pour rester lisible
  const primaryL = Math.min(58, Math.max(34, l1));
  const primaryS = Math.min(92, Math.max(38, s1));
  const primary = hslString(h1, primaryS, primaryL);

  const accentH = h2 === h1 ? (h1 + 32) % 360 : h2;
  const accent = hslString(accentH, Math.min(90, Math.max(45, s2)), Math.min(60, Math.max(40, l2)));

  const secondary = hslString(h1, Math.min(30, primaryS * 0.35), 94);
  const background = hslString(h1, 20, 98);
  const muted = hslString(h1, 16, 95);
  const border = hslString(h1, 18, 88);
  const foreground = hslString(h1, 25, 14);
  const heading = hslString(h1, Math.min(60, primaryS), Math.max(18, primaryL - 20));

  return {
    primary,
    primary_foreground: readableForeground(primary),
    secondary,
    secondary_foreground: foreground,
    accent,
    accent_foreground: readableForeground(accent),
    button: primary,
    button_foreground: readableForeground(primary),
    menu: hslString(h1, Math.min(45, primaryS), Math.max(16, primaryL - 24)),
    menu_foreground: "0 0% 100%",
    heading,
    background,
    foreground,
    muted,
    border,
  };
}

/** Génère la palette directement depuis une image. */
export async function paletteFromLogo(src: string): Promise<Palette> {
  const colors = await extractDominantColors(src);
  return buildPalette(colors);
}
