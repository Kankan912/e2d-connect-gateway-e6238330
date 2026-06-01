## Summary
Bump two action versions in `.github/workflows/security-rls.yml` to eliminate the GitHub deprecation warning about Node 20.

## Changes
- `actions/checkout@v4` → `actions/checkout@v5` (line 28)
- `oven-sh/setup-bun@v1` → `oven-sh/setup-bun@v2` (line 31)

No other workflow logic changes.