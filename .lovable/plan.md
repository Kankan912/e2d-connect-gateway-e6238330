## Objectif

Produire un **rapport de traitement téléchargeable (DOCX)** couvrant l'intégralité du programme (Phases 2.4 → 6, Lots 1 → 5, Lots A/B/C/P/Q), avec l'état d'exécution vérifié et une section « reste à faire » priorisée.

## Étape 1 — Collecte de l'état réel (vérification avant rédaction)

Avant rédaction, confronter le plan aux faits :
- `.lovable/plan.md` et les documents de `docs/` (AUDIT_COMPLET_2026_07, AUDIT_CORRECTIONS_2026_07, LOT_A/B/C, FINANCIAL_ENGINE, I18N_THEMING, CI_PIPELINE).
- Comptage réel des occurrences `formatFCFA` vs `useMoney` (Lot P).
- Liste des fichiers > 600 lignes (Lot Q3).
- État de `strict` / `strictNullChecks` dans `tsconfig` (Lot Q2).
- Migrations SQL présentes dans `supabase/migrations/` (traçabilité des phases 2.4 → 5).
- Résultat des tests Vitest et du typecheck au moment du rapport.

Aucun chiffre ne sera écrit dans le rapport sans avoir été mesuré à cette étape.

## Étape 2 — Structure du document

1. **Page de titre** — nom du projet, « Rapport de traitement », date, périmètre.
2. **Synthèse exécutive** — avancement global, note d'audit avant/après, points d'attention.
3. **Méthodologie** — comment l'état a été vérifié (lecture code, requêtes SQL, tests).
4. **Phases plateforme (2.4 → 6)** — tableau : phase, objet, livrables, état, preuve (fichier/migration).
5. **Lots d'audit (1 → 5)** — sécurité P0, CI/CSP, performance et observabilité.
6. **Lots fonctionnels (A, A-bis, B, B-bis, C)** — cotisations par exercice, bénéficiaires, situation membre et justificatifs.
7. **Lots transverses (P, Q1, Q2, Q3)** — devise, permissions granulaires, typage strict, découpage des composants.
8. **Corrections de sécurité et monitoring** — findings traités, faux positifs justifiés.
9. **Reste à faire, priorisé** — tableau : item, criticité (P1/P2/P3), impact utilisateur, effort estimé, ordre d'exécution recommandé.
10. **Annexes** — index des documents `docs/`, liste des migrations clés.

## Étape 3 — Génération et contrôle qualité

- Génération via `docx` (Node) dans un script jetable sous `/tmp`, sortie dans `/mnt/documents`.
- Mise en forme : Arial, format A4 (contexte francophone), en-tête/pied de page avec pagination, tableaux à largeurs DXA explicites, styles de titres avec `outlineLevel` et sommaire.
- Aucun code source brut dans le corps du rapport — vocabulaire orienté métier, détails techniques regroupés en annexe.
- Validation du fichier, puis conversion de **chaque page en image** et inspection visuelle (débordements, tableaux coupés, pages blanches) avant livraison.

## Livrable

`RAPPORT_TRAITEMENT_2026_08.docx` dans les documents, prêt au téléchargement et au partage, accompagné d'un résumé des points clés en chat.

## Détails techniques

- Script de génération temporaire (`/tmp`), non versionné dans le projet.
- Largeur de contenu tableau calculée pour A4 avec marges 1 pouce (9026 DXA).
- QA par `libreoffice --convert-to pdf` puis `pdftoppm`, images de contrôle conservées hors `/mnt/documents`.
