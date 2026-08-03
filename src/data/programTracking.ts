/**
 * Suivi d'exécution du programme (phases plateforme + lots d'audit).
 * Source unique de vérité — mettre à jour ce fichier à chaque avancement.
 */

export type TrackingStatus = "termine" | "en_cours" | "non_demarre";

export interface TrackingItem {
  id: string;
  label: string;
  scope: string;
  status: TrackingStatus;
  progress: number;
  detail: string;
}

export interface PendingItem {
  id: string;
  label: string;
  criticality: "P1" | "P2" | "P3";
  impact: string;
  order: number;
}

export const LAST_UPDATE = "2026-08-03";

export const STATUS_LABELS: Record<TrackingStatus, string> = {
  termine: "Terminé",
  en_cours: "En cours",
  non_demarre: "Non démarré",
};

export const phases: TrackingItem[] = [
  {
    id: "2.4",
    label: "Phase 2.4",
    scope: "Refonte RLS tenant-aware",
    status: "termine",
    progress: 100,
    detail: "8 migrations, current_association_id() et _apply_tenant_rls()",
  },
  {
    id: "2.5",
    label: "Phase 2.5",
    scope: "Frontend multi-tenant",
    status: "termine",
    progress: 100,
    detail: "AssociationContext, AssociationSwitcher, tenantQuery",
  },
  {
    id: "2.6",
    label: "Phase 2.6",
    scope: "Provisioning des associations",
    status: "termine",
    progress: 100,
    detail: "Edge function provision-association, écran plateforme",
  },
  {
    id: "3",
    label: "Phase 3",
    scope: "RBAC granulaire et journal d'audit",
    status: "termine",
    progress: 100,
    detail: "has_permission(), current_tenant_id(), log_audit()",
  },
  {
    id: "4",
    label: "Phase 4",
    scope: "Moteur financier unifié",
    status: "termine",
    progress: 100,
    detail: "record_caisse_movement(), CaisseService, snapshot des soldes",
  },
  {
    id: "5",
    label: "Phase 5",
    scope: "Prêts, aides et bénéficiaires",
    status: "termine",
    progress: 100,
    detail: "Statuts unifiés, workflow des aides, docs/AUDIT_PHASE5_METIER.md",
  },
  {
    id: "6",
    label: "Phase 6",
    scope: "Internationalisation et personnalisation",
    status: "termine",
    progress: 100,
    detail: "i18next FR/EN, thèmes et logos par association",
  },
];

export const lots: TrackingItem[] = [
  {
    id: "1",
    label: "Lot 1",
    scope: "Correctifs critiques de sécurité",
    status: "termine",
    progress: 100,
    detail: "Annulation comptable, validation des fonctions serveur",
  },
  {
    id: "2",
    label: "Lot 2",
    scope: "Intégration continue et sécurité web",
    status: "termine",
    progress: 100,
    detail: "Pipeline CI, en-têtes CSP/HSTS, CORS centralisé",
  },
  {
    id: "3",
    label: "Lot 3",
    scope: "Règles métier des intérêts",
    status: "termine",
    progress: 100,
    detail: "Distribution au prorata dans BeneficiaireService",
  },
  {
    id: "4",
    label: "Lot 4",
    scope: "Performance",
    status: "termine",
    progress: 100,
    detail: "Chargement différé, découpage des bundles",
  },
  {
    id: "5",
    label: "Lot 5",
    scope: "Observabilité",
    status: "termine",
    progress: 100,
    detail: "Sentry, journalisation standardisée",
  },
  {
    id: "A",
    label: "Lot A",
    scope: "Cotisations par exercice",
    status: "termine",
    progress: 100,
    detail: "exercise_contribution_settings, CotisationPaymentEngine",
  },
  {
    id: "A-bis",
    label: "Lot A-bis",
    scope: "Câblage des cotisations",
    status: "termine",
    progress: 100,
    detail: "Verrouillage des exercices clos, plafonds de versement",
  },
  {
    id: "B",
    label: "Lot B",
    scope: "Calendrier des bénéficiaires",
    status: "termine",
    progress: 100,
    detail: "Attribution automatique et validation des paiements",
  },
  {
    id: "B-bis",
    label: "Lot B-bis",
    scope: "Découpage des écrans bénéficiaires",
    status: "termine",
    progress: 100,
    detail: "Modales extraites, composants allégés",
  },
  {
    id: "C",
    label: "Lot C",
    scope: "Situation du membre et justificatifs",
    status: "termine",
    progress: 100,
    detail: "get_membre_situation, page Ma Situation, export PDF",
  },
  {
    id: "P",
    label: "Lot P",
    scope: "Devise dynamique par association",
    status: "en_cours",
    progress: 40,
    detail: "Écrans financiers migrés vers useMoney, reste les écrans secondaires",
  },
  {
    id: "Q1",
    label: "Lot Q1",
    scope: "Permissions granulaires",
    status: "termine",
    progress: 100,
    detail: "105 permissions administrateur, suppression du contournement",
  },
  {
    id: "Q2",
    label: "Lot Q2",
    scope: "Typage strict",
    status: "non_demarre",
    progress: 0,
    detail: "Activation progressive à partir du domaine financier",
  },
  {
    id: "Q3",
    label: "Lot Q3",
    scope: "Découpage des fichiers volumineux",
    status: "en_cours",
    progress: 55,
    detail: "Configuration e-mail et clôture de réunion découpées, autres fichiers en attente",
  },
];

export const pendingItems: PendingItem[] = [
  {
    id: "q2",
    label: "Activer le typage strict sur le domaine financier puis le reste du projet",
    criticality: "P1",
    impact: "Fiabilité des calculs et détection des erreurs avant mise en ligne",
    order: 1,
  },
  {
    id: "q3",
    label: "Poursuivre le découpage des écrans encore trop volumineux",
    criticality: "P2",
    impact: "Maintenance et rapidité des évolutions",
    order: 2,
  },
  {
    id: "p",
    label: "Généraliser l'affichage de la devise de l'association sur tous les écrans",
    criticality: "P3",
    impact: "Cohérence d'affichage pour les associations hors FCFA",
    order: 3,
  },
];
