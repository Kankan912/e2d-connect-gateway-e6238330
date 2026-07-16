# Pipeline CI

Fichier : `.github/workflows/ci.yml`.

## Déclencheurs

- `pull_request` sur toutes les branches ciblant `main`
- `push` sur `main`
- Déclenchement manuel (`workflow_dispatch`)

La concurrence est activée : un nouveau push sur la même PR annule le run précédent.

## Jobs

| Job | Objet | Commande locale équivalente |
|---|---|---|
| `lint` | ESLint (`eslint.config.js`) | `bun run lint` |
| `typecheck` | TypeScript en mode noEmit sur `tsconfig.app.json` | `bunx tsc --noEmit -p tsconfig.app.json` |
| `test` | Tests Vitest hors suite RLS d'intégration | `bunx vitest run --exclude 'src/test/security/**'` |
| `build` | Bundle Vite production | `bun run build` |
| `sast-codeql` | Analyse statique GitHub CodeQL (JS/TS, `security-and-quality`) | — |
| `sast-semgrep` | Analyse Semgrep (`p/owasp-top-ten`, `p/typescript`, `p/react`, `p/javascript`) | `semgrep ci --config p/owasp-top-ten ...` |
| `secrets-scan` | Détection de secrets via Gitleaks | `gitleaks detect --source .` |
| `deps-audit` | Audit dépendances (non bloquant) | `bun audit --audit-level=high` |
| `ci-status` | Job récapitulatif — requis en branch protection | — |

La suite RLS (`src/test/security/**`) reste couverte par le workflow dédié `.github/workflows/security-rls.yml` qui utilise des comptes Supabase de test.

## Branch protection recommandée

Sur `main`, exiger le status check **`CI status`** (job `ci-status`). Ce job échoue dès que `lint`, `typecheck`, `test`, `build`, `sast-codeql`, `sast-semgrep` ou `secrets-scan` échoue.

`deps-audit` est en `continue-on-error: true` : il produit un warning mais ne bloque pas le merge (les vulnérabilités connues sont traitées via des PR de mise à jour dédiées).

## Secrets GitHub optionnels

- `SEMGREP_APP_TOKEN` — pour remonter les findings dans l'app Semgrep Cloud (optionnel).
- `GITLEAKS_LICENSE` — pour utiliser Gitleaks en mode organisation (optionnel, la version open source fonctionne sans).

Les secrets RLS (`VITE_TEST_*`) restent gérés par le workflow `security-rls.yml`.

## Reproduction locale

```bash
bun install --frozen-lockfile
bun run lint
bunx tsc --noEmit -p tsconfig.app.json
bunx vitest run --exclude 'src/test/security/**'
bun run build
```

Pour Semgrep : `pipx run semgrep ci --config p/owasp-top-ten --config p/typescript --config p/react`.
Pour Gitleaks : `brew install gitleaks && gitleaks detect --source .`.
