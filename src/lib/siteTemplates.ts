/**
 * Registre des modèles de site public.
 *
 * Un modèle définit uniquement la *structure d'affichage* (disposition,
 * densité, style du héros et des cartes). Les contenus restent stockés dans
 * les tables `site_*` : changer de modèle ne supprime donc aucun contenu.
 */

export type SiteTemplateId =
  | "institutionnel"
  | "moderne"
  | "communautaire"
  | "sportif"
  | "professionnel"
  | "associatif"
  | "evenementiel"
  | "minimaliste"
  | "dynamique"
  | "premium";

export interface SiteTemplate {
  id: SiteTemplateId;
  nom: string;
  description: string;
  /** Disposition du héros. */
  hero: "centered" | "split" | "banner" | "overlay";
  /** Disposition des sections de contenu. */
  layout: "stacked" | "grid" | "masonry" | "zigzag";
  /** Densité / rayon des cartes. */
  density: "compact" | "confortable" | "aere";
  radius: string;
}

export const SITE_TEMPLATES: SiteTemplate[] = [
  {
    id: "institutionnel",
    nom: "Institutionnel",
    description: "Structure sobre et hiérarchisée, adaptée aux organisations formelles.",
    hero: "banner",
    layout: "stacked",
    density: "confortable",
    radius: "0.375rem",
  },
  {
    id: "moderne",
    nom: "Moderne",
    description: "Héros scindé, grandes typographies et cartes arrondies.",
    hero: "split",
    layout: "grid",
    density: "aere",
    radius: "1rem",
  },
  {
    id: "communautaire",
    nom: "Communautaire",
    description: "Met en avant les membres, les activités et la galerie photo.",
    hero: "centered",
    layout: "masonry",
    density: "confortable",
    radius: "0.75rem",
  },
  {
    id: "sportif",
    nom: "Sportif",
    description: "Bandeau plein écran, résultats et calendrier mis en avant.",
    hero: "overlay",
    layout: "grid",
    density: "compact",
    radius: "0.5rem",
  },
  {
    id: "professionnel",
    nom: "Professionnel",
    description: "Présentation de services, partenaires et contacts.",
    hero: "split",
    layout: "zigzag",
    density: "confortable",
    radius: "0.5rem",
  },
  {
    id: "associatif",
    nom: "Associatif classique",
    description: "Modèle traditionnel : présentation, actualités, adhésion.",
    hero: "banner",
    layout: "stacked",
    density: "confortable",
    radius: "0.5rem",
  },
  {
    id: "evenementiel",
    nom: "Événementiel",
    description: "Agenda et évènements en première position.",
    hero: "overlay",
    layout: "grid",
    density: "aere",
    radius: "0.875rem",
  },
  {
    id: "minimaliste",
    nom: "Minimaliste",
    description: "Beaucoup d'espace, peu d'éléments, lecture rapide.",
    hero: "centered",
    layout: "stacked",
    density: "aere",
    radius: "0.25rem",
  },
  {
    id: "dynamique",
    nom: "Dynamique",
    description: "Couleurs affirmées, animations et blocs asymétriques.",
    hero: "split",
    layout: "masonry",
    density: "compact",
    radius: "1.25rem",
  },
  {
    id: "premium",
    nom: "Premium",
    description: "Rendu haut de gamme, contrastes marqués et grandes images.",
    hero: "overlay",
    layout: "zigzag",
    density: "aere",
    radius: "0.75rem",
  },
];

export const DEFAULT_TEMPLATE_ID: SiteTemplateId = "institutionnel";

export function getTemplate(id?: string | null): SiteTemplate {
  return SITE_TEMPLATES.find((t) => t.id === id) ?? SITE_TEMPLATES[0];
}
