/**
 * Application de la charte graphique d'une association aux variables CSS.
 *
 * Deux familles de variables sont posées :
 *  - `--tenant-*` : accès direct aux jetons bruts (documents, exports…)
 *  - variables du design system (`--primary`, `--background`, …) afin que
 *    l'ensemble des composants shadcn (admin, portail, site public, page de
 *    connexion) hérite automatiquement de la charte.
 */
import { readableForeground } from "@/lib/paletteFromLogo";

export type ThemeTokens = Record<string, string> | null | undefined;

/** Correspondance jeton de charte → variable du design system. */
const DESIGN_SYSTEM_MAP: Record<string, string[]> = {
  primary: ["--primary"],
  primary_foreground: ["--primary-foreground"],
  secondary: ["--secondary"],
  secondary_foreground: ["--secondary-foreground"],
  accent: ["--accent"],
  accent_foreground: ["--accent-foreground"],
  background: ["--background", "--card", "--popover"],
  foreground: ["--foreground", "--card-foreground", "--popover-foreground"],
  muted: ["--muted"],
  border: ["--border", "--input"],
  menu: ["--sidebar-background"],
  menu_foreground: ["--sidebar-foreground"],
  radius: ["--radius"],
};

const isColorToken = (value: string) => /^-?\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(value.trim());

/** Retire toutes les variables posées par un tenant précédent. */
export function clearThemeTokens() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  Array.from(root.style)
    .filter((prop) => prop.startsWith("--"))
    .forEach((prop) => root.style.removeProperty(prop));
}

export function applyThemeTokens(tokens: ThemeTokens) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  clearThemeTokens();
  if (!tokens) return;

  Object.entries(tokens).forEach(([key, value]) => {
    if (typeof value !== "string" || !value.trim()) return;
    root.style.setProperty(`--tenant-${key}`, value);
    const targets = DESIGN_SYSTEM_MAP[key];
    if (!targets) return;
    if (key !== "radius" && !isColorToken(value)) return;
    targets.forEach((cssVar) => root.style.setProperty(cssVar, value));
  });

  // Sécurise la lisibilité : si un fond est défini sans texte associé,
  // on calcule automatiquement une couleur de texte contrastée.
  const pairs: Array<[string, string, string]> = [
    ["primary", "primary_foreground", "--primary-foreground"],
    ["secondary", "secondary_foreground", "--secondary-foreground"],
    ["accent", "accent_foreground", "--accent-foreground"],
    ["menu", "menu_foreground", "--sidebar-foreground"],
  ];
  pairs.forEach(([bgKey, fgKey, cssVar]) => {
    const bg = tokens[bgKey];
    if (bg && isColorToken(bg) && !tokens[fgKey]) {
      root.style.setProperty(cssVar, readableForeground(bg));
    }
  });
}
